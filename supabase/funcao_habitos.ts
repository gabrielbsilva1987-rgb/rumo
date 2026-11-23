// =====================================================================
//  Função "habitos" (Supabase → Edge Functions) — app Rumo
//  Roda a cada minuto (pg_cron). Para cada usuário com configuração:
//   • lembrete na hora de cada hábito + reforço se não marcar
//   • água: lembra só quando o consumo está abaixo do ritmo esperado
//   • sono: bom-dia para registrar a noite e aviso para desacelerar
//   • fechamento do dia com o que falta marcar
//   • pesagem semanal e revisão da semana (com resumo)
// =====================================================================
import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const TZ = "America/Sao_Paulo";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:rumo@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

// Precisa ser igual ao CFG_PADRAO do app (app.js)
const PADRAO: any = {
  nome: "Gabriel",
  leitura: { ativo: true, meta: 20, hora: "06:30", dias: [0, 1, 2, 3, 4, 5, 6], reforco_min: 90 },
  estudo: { ativo: true, meta: 30, hora: "20:00", dias: [1, 2, 3, 4, 5], reforco_min: 60 },
  exercicio: { ativo: true, hora: "18:00", dias: [1, 2, 3, 4, 5, 6], tipos: ["Academia", "Cardio"], reforco_min: 60 },
  agua: { ativo: true, meta: 3000, inicio: "07:00", fim: "21:00", intervalo_min: 120 },
  sono: { ativo: true, meta: 7, acordar: "06:00", aviso_antes_min: 45 },
  peso: { inicial: 139, meta: 99, dia: 0, hora: "08:00" },
  revisao: { dia: 0, hora: "17:00" },
  fechamento: "21:30",
  extras: [],
};
function mesclar(d: any) {
  const c: any = { ...PADRAO, ...(d || {}) };
  for (const k of ["leitura", "estudo", "exercicio", "agua", "sono", "peso", "revisao"]) c[k] = { ...PADRAO[k], ...((d || {})[k] || {}) };
  return c;
}

function agoraSP() {
  const o: Record<string, string> = {};
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(new Date()).forEach((p) => (o[p.type] = p.value));
  if (o.hour === "24") o.hour = "00";
  const dia = `${o.year}-${o.month}-${o.day}`;
  return { dia, min: +o.hour * 60 + +o.minute, sem: new Date(dia + "T12:00:00Z").getUTCDay() };
}
function addDias(s: string, n: number) { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const hm = (s: string) => { const [h, m] = (s || "00:00").split(":").map(Number); return h * 60 + (m || 0); };
const fmtMin = (t: number) => { t = ((t % 1440) + 1440) % 1440; return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const litros = (ml: number) => (ml / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: ml % 1000 ? 1 : 0 }) + " L";
const kg = (x: number) => (+x).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const na = (dias: number[] | undefined, sem: number) => !Array.isArray(dias) || dias.includes(sem);

type Sub = { endpoint: string; p256dh: string; auth: string; user_id: string };

async function enviar(subs: Sub[], titulo: string, corpo: string, tag?: string) {
  let ok = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ titulo, corpo, tag }),
        { TTL: 3600, urgency: "high" },
      );
      ok++;
    } catch (e: any) {
      console.error("push falhou", e?.statusCode, e?.body);
      if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from("h_push").delete().eq("endpoint", s.endpoint);
    }
  }
  return ok;
}

// Registra o aviso antes de enviar; se já existia, não envia de novo
async function primeiraVez(user_id: string, data: string, chave: string) {
  const { error } = await sb.from("h_avisos").insert({ user_id, data, chave });
  return !error;
}

Deno.serve(async (req) => {
  const segredo = Deno.env.get("CRON_SECRET");
  if (segredo && req.headers.get("x-cron-secret") !== segredo) return new Response("não autorizado", { status: 401 });

  const { dia, min, sem } = agoraSP();
  const log: string[] = [];
  const [{ data: cfgs }, { data: todasSubs }] = await Promise.all([
    sb.from("h_config").select("user_id,dados"),
    sb.from("h_push").select("*"),
  ]);

  for (const linha of cfgs || []) {
    const uid = linha.user_id;
    const c = mesclar(linha.dados);
    const subs = ((todasSubs || []) as Sub[]).filter((s) => s.user_id === uid);
    if (!subs.length) continue;

    const { data: regs } = await sb.from("h_registros").select("habito,valor,feito").eq("user_id", uid).eq("data", dia);
    const R: Record<string, { valor: number; feito: boolean }> = {};
    for (const r of regs || []) R[r.habito] = { valor: +r.valor, feito: r.feito };
    const feito = (h: string) => !!R[h]?.feito;
    const valor = (h: string) => R[h]?.valor || 0;

    // Lembrete na hora + reforço (janela de 2h para não mandar avisos velhos)
    const lembrar = async (h: string, t: number, titulo: string, corpo: string, sufixo = "") => {
      if (min >= t && min < t + 120 && await primeiraVez(uid, dia, h + sufixo)) {
        await enviar(subs, titulo, corpo, `${h}${sufixo}`);
        log.push(`${uid.slice(0, 4)} ${h}${sufixo}`);
      }
    };

    // ---------- Sono ----------
    if (c.sono.ativo) {
      const acordar = hm(c.sono.acordar);
      const deitar = acordar - c.sono.meta * 60;               // ex.: 6:00 - 7h = 23:00
      const aviso = deitar - (+c.sono.aviso_antes_min || 45);  // ex.: 22:15
      if (!feito("sono") && !R["sono"]) {
        await lembrar("sono", acordar + 10, `☀️ Bom dia, ${c.nome}!`, "Como foi a noite? Marque no app a que horas você dormiu.", "-manha");
      }
      const tAviso = ((aviso % 1440) + 1440) % 1440;
      await lembrar("sono", tAviso, "🌙 Hora de desacelerar", `Para dormir ${c.sono.meta}h e acordar às ${fmtMin(acordar)}, deite até ${fmtMin(deitar)}. Telas de lado.`, "-noite");
    }

    // ---------- Leitura ----------
    if (c.leitura.ativo && na(c.leitura.dias, sem) && !feito("leitura")) {
      const t = hm(c.leitura.hora), falta = Math.max(0, c.leitura.meta - valor("leitura"));
      let livroTxt = "Livro na mão antes do celular.";
      if (min >= t && min < t + 120) {
        const { data: lendo } = await sb.from("h_livros").select("id,titulo,paginas,pagina_atual").eq("user_id", uid).eq("status", "lendo").order("criado_em");
        const l = (lendo || []).find((x) => x.id === c.leitura.livro_atual) || (lendo || []).slice(-1)[0];
        if (l) livroTxt = `"${l.titulo}": você está na p. ${l.pagina_atual}${l.paginas ? ` de ${l.paginas} (${Math.round((l.pagina_atual / l.paginas) * 100)}%)` : ""}.`;
      }
      await lembrar("leitura", t, "📖 Hora da leitura", `Suas ${c.leitura.meta} páginas de hoje. ${livroTxt}`);
      await lembrar("leitura", t + (+c.leitura.reforco_min || 90), "📖 Ainda dá tempo de ler", `Faltam ${falta} páginas para a meta de hoje.`, "-reforco");
    }

    // ---------- Exercício ----------
    if (c.exercicio.ativo && na(c.exercicio.dias, sem) && !feito("exercicio")) {
      const t = hm(c.exercicio.hora);
      const tipos = (c.exercicio.tipos || []).join(" + ") || "Treino";
      await lembrar("exercicio", t, "🏋️ Hora do treino", `${tipos}. Cada treino é um passo rumo aos ${kg(c.peso.meta)} kg.`);
      await lembrar("exercicio", t + (+c.exercicio.reforco_min || 60), "🏋️ Bora treinar?", "Ainda não marcou o treino de hoje. Mesmo um treino curto conta.", "-reforco");
    }

    // ---------- Estudo ----------
    if (c.estudo.ativo && na(c.estudo.dias, sem) && !feito("estudo")) {
      const t = hm(c.estudo.hora);
      await lembrar("estudo", t, "🎓 Hora de estudar", `${c.estudo.meta} min do seu curso. Abra a próxima aula e comece.`);
      await lembrar("estudo", t + (+c.estudo.reforco_min || 60), "🎓 Ainda dá para estudar hoje", `Faltam ${Math.max(0, c.estudo.meta - valor("estudo"))} min para a meta.`, "-reforco");
    }

    // ---------- Hábitos criados por você ----------
    const extras = (c.extras || []).filter((x: any) => x.ativo !== false && (!x.criado || x.criado <= dia));
    for (const x of extras) {
      if (!x.hora || !na(x.dias, sem) || feito(x.id)) continue;
      const t = hm(x.hora), nome = `${x.emoji || "⭐"} ${x.nome}`;
      const corpo = x.tipo === "check" ? "Depois marque no app." : `Meta de hoje: ${x.meta} ${x.unidade || ""}. Depois registre no app.`;
      await lembrar(x.id, t, nome, corpo);
      await lembrar(x.id, t + 60, `${nome}: ainda dá tempo`, x.tipo === "check" ? "Ainda não marcado hoje." : `Você está em ${valor(x.id)} de ${x.meta} ${x.unidade || ""}.`, "-reforco");
    }

    // ---------- Água: só lembra se estiver abaixo do ritmo ----------
    if (c.agua.ativo && !feito("agua")) {
      const ini = hm(c.agua.inicio), fim = hm(c.agua.fim), passo = Math.max(30, +c.agua.intervalo_min || 120);
      for (let t = ini + passo; t <= fim; t += passo) {
        if (min < t || min >= t + 30) continue;
        const esperado = Math.round((c.agua.meta * (t - ini)) / (fim - ini));
        const bebido = valor("agua");
        if (bebido + 250 <= esperado && await primeiraVez(uid, dia, `agua-${t}`)) {
          await enviar(subs, "💧 Hora da água", `Você está em ${litros(bebido)} de ${litros(c.agua.meta)}. O ideal agora seria ${litros(esperado)}: beba um copo.`, "agua");
          log.push(`${uid.slice(0, 4)} agua ${t}`);
        }
      }
    }

    // ---------- Fechamento do dia ----------
    const tf = hm(c.fechamento || "21:30");
    if (min >= tf && min < tf + 60) {
      const falta: string[] = [];
      if (c.leitura.ativo && na(c.leitura.dias, sem) && !feito("leitura")) falta.push("leitura");
      if (c.exercicio.ativo && na(c.exercicio.dias, sem) && !feito("exercicio")) falta.push("treino");
      if (c.estudo.ativo && na(c.estudo.dias, sem) && !feito("estudo")) falta.push("estudo");
      for (const x of extras) if (na(x.dias, sem) && !feito(x.id)) falta.push(x.nome.toLowerCase());
      if (c.agua.ativo && !feito("agua")) falta.push(`água (${litros(valor("agua"))} de ${litros(c.agua.meta)})`);
      if (falta.length && await primeiraVez(uid, dia, "fechamento")) {
        await enviar(subs, "✅ Fechamento do dia", `Falta: ${falta.join(", ")}. Se já fez, marque no app.`, "fechamento");
        log.push(`${uid.slice(0, 4)} fechamento`);
      }
    }

    // ---------- Pesagem semanal ----------
    if (sem === +c.peso.dia) {
      const t = hm(c.peso.hora);
      if (min >= t && min < t + 240) {
        const { count } = await sb.from("h_peso").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("data", addDias(dia, -2));
        if (!count && await primeiraVez(uid, dia, "peso")) {
          await enviar(subs, "⚖️ Dia de pesagem", "Em jejum, depois de ir ao banheiro. Registre o peso no app.", "peso");
          log.push(`${uid.slice(0, 4)} peso`);
        }
      }
    }

    // ---------- Revisão semanal ----------
    if (sem === +c.revisao.dia) {
      const t = hm(c.revisao.hora);
      if (min >= t && min < t + 240) {
        const { count: jaFez } = await sb.from("h_revisoes").select("semana", { count: "exact", head: true }).eq("user_id", uid).eq("semana", dia);
        if (!jaFez && await primeiraVez(uid, dia, "revisao")) {
          const de = addDias(dia, -6);
          const [{ data: rs }, { data: ps }] = await Promise.all([
            sb.from("h_registros").select("data,habito,feito").eq("user_id", uid).gte("data", de).lte("data", dia),
            sb.from("h_peso").select("data,kg").eq("user_id", uid).order("data", { ascending: false }).limit(2),
          ]);
          let esperados = 0, feitos = 0;
          for (let d = de; d <= dia; d = addDias(d, 1)) {
            const s = new Date(d + "T12:00:00Z").getUTCDay();
            for (const h of ["leitura", "estudo", "exercicio", "agua", "sono", ...extras.map((x: any) => x.id)]) {
              const hab = c[h] || extras.find((x: any) => x.id === h);
              if (hab.ativo === false || (h in PADRAO && !hab.ativo) || !na(hab.dias, s) || (hab.criado && d < hab.criado)) continue;
              esperados++;
              if ((rs || []).some((r) => r.data === d && r.habito === h && r.feito)) feitos++;
            }
          }
          const pct = esperados ? Math.round((feitos / esperados) * 100) : 0;
          let pesoTxt = "";
          if (ps && ps.length) {
            pesoTxt = ` Peso: ${kg(ps[0].kg)} kg`;
            if (ps.length > 1) { const dif = +ps[0].kg - +ps[1].kg; pesoTxt += ` (${dif <= 0 ? "" : "+"}${kg(dif)} kg)`; }
            pesoTxt += ".";
          }
          await enviar(subs, "📋 Revisão da semana", `Você cumpriu ${pct}% dos hábitos.${pesoTxt} Abra o app para planejar a próxima semana.`, "revisao");
          log.push(`${uid.slice(0, 4)} revisao`);
        }
      }
    }
  }

  // ---------- Mensagens avulsas (teste) ----------
  const { data: fila } = await sb.from("h_fila").select("*").eq("enviado", false).limit(10);
  for (const f of fila || []) {
    const { data: pegou } = await sb.from("h_fila").update({ enviado: true }).eq("id", f.id).eq("enviado", false).select("id");
    if (!pegou?.length) continue;
    const n = await enviar(((todasSubs || []) as Sub[]).filter((s) => s.user_id === f.user_id), f.titulo, f.corpo);
    log.push(`fila ${f.id} -> ${n} celular(es)`);
  }

  return new Response(JSON.stringify({ ok: true, dia, min, log }), { headers: { "Content-Type": "application/json" } });
});
