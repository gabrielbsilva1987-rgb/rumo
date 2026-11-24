import { CONFIG } from "./config.js";

/* ============================ Constantes ============================ */
const TZ = "America/Sao_Paulo";
const H_BASE = {
  sono: { nome: "Sono", emoji: "🌙", cor: "var(--sono)" },
  leitura: { nome: "Leitura", emoji: "📖", cor: "var(--leitura)" },
  agua: { nome: "Água", emoji: "💧", cor: "var(--agua)" },
  exercicio: { nome: "Treino", emoji: "🏋️", cor: "var(--exercicio)" },
  estudo: { nome: "Estudo", emoji: "🎓", cor: "var(--estudo)" },
};
const BASE = Object.keys(H_BASE);
// Hábitos criados por você ficam em S.cfg.extras
// Dados que chegam do app Saúde (pelo app Atalhos). Não contam na % do dia.
const H_SAUDE = {
  calorias: { nome: "Calorias ativas", emoji: "🔥", cor: "#ff9f43", un: "kcal" },
  passos: { nome: "Passos", emoji: "👟", cor: "#3ddbb0", un: "passos" },
  minutos: { nome: "Exercício", emoji: "⏱️", cor: "#c8f560", un: "min" },
};
const URL_SAUDE = "https://dhxcptqgwfhlaqvfodxp.supabase.co/functions/v1/saude";
const info = (h) => H_BASE[h] || H_SAUDE[h] || (S.cfg.extras || []).find((x) => x.id === h) || { nome: "Hábito", emoji: "⭐", cor: "var(--acc)" };
const hc = (h, c = S.cfg) => H_SAUDE[h] ? { ativo: true, meta: h === "minutos" ? +(c.saude?.min_treino) || 20 : +(c.saude?.[`meta_${h}`]) || 0 } : c[h] || (c.extras || []).find((x) => x.id === h) || {};
const lista = () => [...BASE, ...(S.cfg.extras || []).filter((x) => x.ativo !== false)
  .sort((a, b) => (a.hora || "99").localeCompare(b.hora || "99")).map((x) => x.id)];
const ICONES = ["🧘","🙏","🏃","🚶","🚴","🏊","🤸","⚽","🥗","🍎","🥦","🍳","🥩","☕","🚭","🍬","💊","🦷","🧴","🛁","😴","📵","💻","✍️","📝","📓","🎧","🎸","🎹","🎨","🧠","🗣️","🌎","💰","💵","📊","🧹","🧺","🌱","🌞","🙌","❤️","👨‍👩‍👧","📞","🐶","🎯","✅","⭐"];
const CORES = ["#c8f560","#ffb547","#4cc3ff","#ff7a59","#c08cff","#8f9bff","#ff6fae","#3ddbb0","#ffe14d"];
const SEM_LETRA = ["D", "S", "T", "Q", "Q", "S", "S"];
const SEM_NOME = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const SEG_A_DOM = [1, 2, 3, 4, 5, 6, 0];
const NOTAS = ["😣", "😕", "😐", "🙂", "🤩"];

// Precisa ser igual ao PADRAO da função "habitos" no Supabase
const CFG_PADRAO = {
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
  saude: { meta_calorias: 0, meta_passos: 0, min_treino: 20 },
  alimentacao: { ativo: true, meta_kcal: 0, meta_proteina: 0, altura: 0, idade: 0, sexo: "m" },
};
function mesclarCfg(d) {
  const c = { ...CFG_PADRAO, ...(d || {}) };
  for (const k of ["leitura", "estudo", "exercicio", "agua", "sono", "peso", "revisao", "saude", "alimentacao"]) c[k] = { ...CFG_PADRAO[k], ...((d || {})[k] || {}) };
  return c;
}

const PARAMS = new URLSearchParams(location.search);
const DEMO = PARAMS.has("demo") || !CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes("COLE_AQUI");

/* ============================ Utilidades ============================ */
const $ = (s, el = document) => el.querySelector(s);
const $$last = (s) => { const a = document.querySelectorAll(s); return a[a.length - 1]; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function partesSP(d = new Date()) {
  const o = {};
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(d).forEach((p) => (o[p.type] = p.value));
  if (o.hour === "24") o.hour = "00";
  return o;
}
const hoje = () => { const o = partesSP(); return `${o.year}-${o.month}-${o.day}`; };
const minAgora = () => { const o = partesSP(); return +o.hour * 60 + +o.minute; };
const hm = (s) => { const [h, m] = String(s || "00:00").split(":").map(Number); return h * 60 + (m || 0); };
const fmtMin = (t) => { t = ((t % 1440) + 1440) % 1440; return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const fmtHora = (s) => fmtMin(hm(s));
function addDias(s, n) { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const semDe = (s) => new Date(s + "T12:00:00Z").getUTCDay();
const domingoDe = (s) => addDias(s, (7 - semDe(s)) % 7);
const diasEntre = (a, b) => Math.round((new Date(b + "T12:00:00Z") - new Date(a + "T12:00:00Z")) / 864e5);
const dm = (s) => { const [, m, d] = s.split("-"); return `${+d}/${+m}`; };
const dataLonga = (s) => new Date(s + "T12:00:00Z").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const mesAno = (s) => new Date(s + "T12:00:00Z").toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const num = (x, casas = 1) => (+x).toLocaleString("pt-BR", { maximumFractionDigits: casas });
const litros = (ml) => num(ml / 1000, 2) + " L";
const horasTxt = (h) => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}`; };

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("ver");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("ver"), 2400);
}
function lerLocal(k, p) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : p; } catch { return p; } }
function gravarLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function b64ToU8(b) { const p = "=".repeat((4 - (b.length % 4)) % 4); const r = atob((b + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); }

/* ============================ Dados ============================ */
function apiSupabase(sb, uid) {
  const ok = ({ data, error }) => { if (error) throw error; return data; };
  return {
    async cfg() {
      const d = ok(await sb.from("h_config").select("dados").maybeSingle());
      if (!d) ok(await sb.from("h_config").insert({ dados: {} }));
      return mesclarCfg(d?.dados);
    },
    async salvarCfg(c) { ok(await sb.from("h_config").upsert({ user_id: uid, dados: c, atualizado: new Date().toISOString() })); },
    async regs(de) {
      let out = [];
      for (let i = 0; ; i += 1000) {
        const p = ok(await sb.from("h_registros").select("data,habito,valor,feito,detalhe").gte("data", de).order("data").range(i, i + 999));
        out = out.concat(p);
        if (p.length < 1000) break;
      }
      return out;
    },
    async salvarReg(r) { ok(await sb.from("h_registros").upsert({ ...r, user_id: uid, atualizado: new Date().toISOString() })); },
    async apagarReg(data, habito) { ok(await sb.from("h_registros").delete().eq("data", data).eq("habito", habito)); },
    async pesos() { return ok(await sb.from("h_peso").select("id,data,kg").order("data")); },
    async salvarPeso(data, kg) { ok(await sb.from("h_peso").upsert({ user_id: uid, data, kg }, { onConflict: "user_id,data" })); },
    async apagarPeso(id) { ok(await sb.from("h_peso").delete().eq("id", id)); },
    async revs() { return ok(await sb.from("h_revisoes").select("semana,dados").order("semana", { ascending: false })); },
    async salvarRev(semana, dados) { ok(await sb.from("h_revisoes").upsert({ user_id: uid, semana, dados })); },
    async livros() { return ok(await sb.from("h_livros").select("*").order("criado_em")); },
    async salvarLivro(l) {
      const { id, criado_em, user_id, ...r } = l;
      if (id) return ok(await sb.from("h_livros").update(r).eq("id", id).select().single());
      return ok(await sb.from("h_livros").insert(r).select().single());
    },
    async apagarLivro(id) { ok(await sb.from("h_livros").delete().eq("id", id)); },
    async subirCapa(blob) {
      const path = `${uid}/${Date.now()}.jpg`;
      ok(await sb.storage.from("capas").upload(path, blob, { contentType: "image/jpeg", upsert: true }));
      return sb.storage.from("capas").getPublicUrl(path).data.publicUrl;
    },
    async refeicoes(de) { return ok(await sb.from("h_refeicoes").select("*").gte("data", de).order("criado_em").limit(3000)); },
    async salvarRefeicao(r) {
      const { id, criado_em, user_id, ...x } = r;
      if (id) return ok(await sb.from("h_refeicoes").update(x).eq("id", id).select().single());
      return ok(await sb.from("h_refeicoes").insert(x).select().single());
    },
    async apagarRefeicao(r) {
      ok(await sb.from("h_refeicoes").delete().eq("id", r.id));
      if (r.foto) await sb.storage.from("refeicoes").remove([r.foto]);
    },
    async subirFotoRefeicao(blob) {
      const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      ok(await sb.storage.from("refeicoes").upload(path, blob, { contentType: "image/jpeg" }));
      return path;
    },
    async urlsFotos(paths) {
      if (!paths.length) return {};
      const { data } = await sb.storage.from("refeicoes").createSignedUrls(paths, 3600);
      return Object.fromEntries((data || []).filter((x) => x.signedUrl).map((x) => [x.path, x.signedUrl]));
    },
    async estimar(corpo) {
      const { data, error } = await sb.functions.invoke("comida", { body: corpo });
      if (error) {
        let msg = "Não consegui estimar agora.";
        try { const j = await error.context.json(); if (j?.erro) msg = j.erro; } catch {}
        throw new Error(msg);
      }
      if (data?.erro) throw new Error(data.erro);
      return data;
    },
    async salvarSub(sub) {
      const j = sub.toJSON();
      ok(await sb.from("h_push").upsert({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_id: uid }, { onConflict: "endpoint" }));
    },
    async teste() { ok(await sb.from("h_fila").insert({ titulo: "🔔 Teste do Rumo", corpo: "Tudo certo! Os lembretes vão chegar neste celular." })); },
  };
}

function apiLocal() {
  const L = (k, p) => lerLocal("rumo_demo_" + k, p);
  const G = (k, v) => gravarLocal("rumo_demo_" + k, v);
  if (!L("ok")) semearDemo(G);
  return {
    async cfg() { return mesclarCfg(L("cfg", {})); },
    async salvarCfg(c) { G("cfg", c); },
    async regs(de) { return L("regs", []).filter((r) => r.data >= de); },
    async salvarReg(r) { const a = L("regs", []).filter((x) => !(x.data === r.data && x.habito === r.habito)); a.push(r); G("regs", a); },
    async apagarReg(data, habito) { G("regs", L("regs", []).filter((x) => !(x.data === data && x.habito === habito))); },
    async pesos() { return L("pesos", []).sort((a, b) => a.data.localeCompare(b.data)); },
    async salvarPeso(data, kg) { const a = L("pesos", []).filter((p) => p.data !== data); a.push({ id: Date.now(), data, kg }); G("pesos", a); },
    async apagarPeso(id) { G("pesos", L("pesos", []).filter((p) => p.id !== id)); },
    async revs() { return L("revs", []).sort((a, b) => b.semana.localeCompare(a.semana)); },
    async salvarRev(semana, dados) { const a = L("revs", []).filter((r) => r.semana !== semana); a.push({ semana, dados }); G("revs", a); },
    async livros() { return L("livros", []); },
    async salvarLivro(l) {
      const a = L("livros", []);
      const novo = l.id ? { ...a.find((x) => x.id === l.id), ...l } : { ...l, id: Date.now(), criado_em: new Date().toISOString() };
      G("livros", [...a.filter((x) => x.id !== novo.id), novo].sort((x, y) => x.criado_em.localeCompare(y.criado_em)));
      return novo;
    },
    async apagarLivro(id) { G("livros", L("livros", []).filter((x) => x.id !== id)); },
    async subirCapa(blob) { return await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); }); },
    async refeicoes(de) { return L("refs", []).filter((r) => r.data >= de); },
    async salvarRefeicao(r) {
      const a = L("refs", []);
      const novo = r.id ? { ...a.find((x) => x.id === r.id), ...r } : { ...r, id: Date.now(), criado_em: new Date().toISOString() };
      G("refs", [...a.filter((x) => x.id !== novo.id), novo].sort((x, y) => x.criado_em.localeCompare(y.criado_em)));
      return novo;
    },
    async apagarRefeicao(r) { G("refs", L("refs", []).filter((x) => x.id !== r.id)); },
    async subirFotoRefeicao(blob) { return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); }); },
    async urlsFotos(paths) { return Object.fromEntries(paths.map((p) => [p, p])); },
    async estimar({ texto }) {
      await new Promise((r) => setTimeout(r, 400));
      const partes = String(texto || "prato da foto").split(/,| e |;/).map((x) => x.trim()).filter(Boolean);
      return { itens: partes.map((nome, i) => ({ nome, porcao: "porção média", kcal: 120 + ((i * 97) % 260), proteina: 8 + i * 3, carbo: 15, gordura: 6 })), observacao: "Estimativa de exemplo (modo demonstração).", confianca: "media" };
    },
    async salvarSub() { throw new Error("No modo demonstração não há notificações."); },
    async teste() { throw new Error("No modo demonstração não há notificações."); },
  };
}

// Dados de exemplo (só no modo demonstração)
function semearDemo(G) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const c = mesclarCfg({});
  const regs = [], pesos = [], hj = hoje();
  for (let i = 48; i >= 1; i--) {
    const d = addDias(hj, -i), s = semDe(d), bom = i < 30 ? 0.82 : 0.6;
    const push = (habito, valor, detalhe = {}) => regs.push({ data: d, habito, valor, detalhe, feito: calcFeito(habito, valor, c) });
    push("sono", rnd() < bom ? 7 + Math.round(rnd() * 4) / 4 : 5.5 + Math.round(rnd() * 4) / 4, { deitou: "23:00" });
    push("leitura", rnd() < bom ? 20 + Math.round(rnd() * 10) : Math.round(rnd() * 15));
    push("agua", rnd() < bom ? 3000 : 1500 + Math.round(rnd() * 5) * 250);
    if (c.exercicio.dias.includes(s) && rnd() < bom + 0.05) push("exercicio", 2, { tipos: ["Academia", "Cardio"] });
    if (c.estudo.dias.includes(s)) push("estudo", rnd() < bom ? 30 + (rnd() < 0.3 ? 15 : 0) : 15);
    push("calorias", 350 + Math.round(rnd() * 500), { em: new Date().toISOString() });
    push("passos", 4000 + Math.round(rnd() * 8000), { em: new Date().toISOString() });
    if (s === 0) pesos.push({ id: i, data: d, kg: Math.round((139 - (48 - i) * 0.13 + (rnd() - 0.5) * 0.8) * 10) / 10 });
  }
  regs.push({ data: hj, habito: "sono", valor: 7.5, detalhe: { deitou: "22:30" }, feito: true });
  regs.push({ data: hj, habito: "leitura", valor: 20, detalhe: {}, feito: true });
  regs.push({ data: hj, habito: "agua", valor: 1500, detalhe: {}, feito: false });
  regs.push({ data: hj, habito: "calorias", valor: 412, detalhe: { em: new Date().toISOString() }, feito: true });
  regs.push({ data: hj, habito: "passos", valor: 6830, detalhe: { em: new Date().toISOString() }, feito: true });
  regs.push({ data: hj, habito: "exercicio", valor: 1, detalhe: { tipos: [], auto: 1 }, feito: true });
  const ultDom = addDias(domingoDe(hj), -7);
  const revs = [{ semana: ultDom, dados: { nota: 4, pct: 81, funcionou: "Ler logo depois do café.", atrapalhou: "Dormi tarde na quinta.", foco: "Deitar até 23h todos os dias" } }];
  const t0 = new Date(Date.now() - 864e5 * 60).toISOString();
  G("livros", [
    { id: 1, titulo: "Hábitos Atômicos", autor: "James Clear", paginas: 320, pagina_atual: 320, status: "lido", inicio: addDias(hj, -45), fim: addDias(hj, -30), capa: null, criado_em: t0 },
    { id: 2, titulo: "O Poder do Hábito", autor: "Charles Duhigg", paginas: 408, pagina_atual: 408, status: "lido", inicio: addDias(hj, -29), fim: addDias(hj, -12), capa: null, criado_em: t0 },
    { id: 3, titulo: "Mindset", autor: "Carol Dweck", paginas: 312, pagina_atual: 312, status: "lido", inicio: addDias(hj, -40), fim: addDias(hj, -20), capa: null, criado_em: t0 },
    { id: 4, titulo: "Essencialismo", autor: "Greg McKeown", paginas: 272, pagina_atual: 118, status: "lendo", inicio: addDias(hj, -11), fim: null, capa: null, criado_em: new Date().toISOString() },
    { id: 5, titulo: "Sapiens", autor: "Yuval Noah Harari", paginas: 464, pagina_atual: 0, status: "quero", inicio: null, fim: null, capa: null, criado_em: new Date().toISOString() },
  ]);
  const ref = (data, tipo, descricao, itens) => ({ id: Math.random(), data, tipo, descricao, foto: null, itens, kcal: itens.reduce((a, i) => a + i.kcal, 0), proteina: itens.reduce((a, i) => a + i.proteina, 0), carbo: 0, gordura: 0, criado_em: data + "T12:00:00Z" });
  const refs = [];
  for (let i = 20; i >= 1; i--) {
    const d = addDias(hj, -i), x = Math.round(rnd() * 600);
    refs.push(ref(d, "cafe", "pão com ovo e café", [{ nome: "Pão francês com ovo", porcao: "1 un", kcal: 290, proteina: 13 }, { nome: "Café com açúcar", porcao: "1 xíc", kcal: 40, proteina: 0 }]));
    refs.push(ref(d, "almoco", "arroz, feijão, frango e salada", [{ nome: "Arroz", porcao: "4 col.", kcal: 220, proteina: 4 }, { nome: "Feijão", porcao: "1 concha", kcal: 110, proteina: 7 }, { nome: "Frango grelhado", porcao: "150 g", kcal: 240, proteina: 45 }]));
    refs.push(ref(d, "jantar", "jantar", [{ nome: "Jantar", porcao: "prato", kcal: 650 + x, proteina: 35 }]));
  }
  refs.push(ref(hj, "cafe", "pão com ovo e café", [{ nome: "Pão francês com ovo", porcao: "1 un", kcal: 290, proteina: 13 }, { nome: "Café com açúcar", porcao: "1 xíc", kcal: 40, proteina: 0 }]));
  refs.push(ref(hj, "almoco", "arroz, feijão, bife grande e salada; 1 lata de Coca", [{ nome: "Arroz branco", porcao: "4 col. de sopa (100 g)", kcal: 130, proteina: 3 }, { nome: "Feijão", porcao: "1 concha (140 g)", kcal: 110, proteina: 7 }, { nome: "Bife grande", porcao: "180 g", kcal: 390, proteina: 48 }, { nome: "Salada", porcao: "1 prato", kcal: 40, proteina: 2 }, { nome: "Coca-Cola", porcao: "350 ml", kcal: 149, proteina: 0 }]));
  G("refs", refs);
  G("cfg", { saude: { meta_passos: 8000, chave: "demo" }, alimentacao: { meta_kcal: 2400, meta_proteina: 160, altura: 180, idade: 39, sexo: "m" } }); G("regs", regs); G("pesos", pesos); G("revs", revs); G("ok", true);
}

/* ============================ Regras dos hábitos ============================ */
function calcFeito(h, valor, c = S.cfg) {
  if (h === "exercicio") return valor > 0;
  const x = hc(h, c);
  if (x.tipo === "check") return valor > 0;
  return valor >= (x.meta ?? Infinity);
}
function programado(h, d, c = S.cfg) {
  const x = hc(h, c);
  if (!x.ativo && !(x.id && x.ativo !== false)) return false;
  if (x.criado && d < x.criado) return false; // hábito novo só conta a partir do dia em que foi criado
  const dias = x.dias;
  return !Array.isArray(dias) || dias.includes(semDe(d));
}
const reg = (d, h) => S.regs.get(`${d}|${h}`);
const feito = (d, h) => !!reg(d, h)?.feito;

function placarDia(d) {
  let prog = 0, ok = 0;
  for (const h of lista()) {
    if (!programado(h, d)) continue;
    prog++;
    if (feito(d, h)) ok++;
  }
  return { prog, ok, pct: prog ? ok / prog : 0 };
}
// Sequência de dias (programados) cumpridos de um hábito, terminando hoje
function sequencia(h, ate = hoje()) {
  let n = 0, d = ate;
  if (programado(h, d) && !feito(d, h)) d = addDias(d, -1);
  for (let i = 0; i < 400; i++, d = addDias(d, -1)) {
    if (d < S.inicioDados) break;
    if (!programado(h, d)) continue;
    if (feito(d, h)) n++; else break;
  }
  return n;
}
function melhorSequencia(h, de, ate) {
  let m = 0, n = 0;
  for (let d = de; d <= ate; d = addDias(d, 1)) {
    if (!programado(h, d)) continue;
    if (feito(d, h)) { n++; m = Math.max(m, n); } else n = 0;
  }
  return m;
}
// Dias seguidos com pelo menos 80% dos hábitos
function sequenciaGeral() {
  let n = 0, d = hoje();
  if (placarDia(d).pct < 0.8) d = addDias(d, -1);
  for (let i = 0; i < 400; i++, d = addDias(d, -1)) {
    if (d < S.inicioDados) break;
    const p = placarDia(d);
    if (!p.prog) continue;
    if (p.pct >= 0.8) n++; else break;
  }
  return n;
}
function pesoAtual() { return S.pesos.length ? +S.pesos[S.pesos.length - 1].kg : +S.cfg.peso.inicial; }
function tendenciaPeso() {
  const ps = S.pesos.filter((p) => p.data >= addDias(hoje(), -63));
  if (ps.length < 2) return null;
  const xs = ps.map((p) => diasEntre(ps[0].data, p.data)), ys = ps.map((p) => +p.kg);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let nu = 0, de = 0;
  xs.forEach((x, i) => { nu += (x - mx) * (ys[i] - my); de += (x - mx) ** 2; });
  if (!de) return null;
  const porDia = nu / de, porSemana = porDia * 7;
  let previsao = null;
  const falta = pesoAtual() - S.cfg.peso.meta;
  if (porDia < -0.005 && falta > 0) previsao = addDias(hoje(), Math.round(falta / -porDia));
  return { porSemana, previsao };
}

/* ============================ Estado ============================ */
const S = {
  sb: null, api: null, cfg: mesclarCfg({}), regs: new Map(), pesos: [], revs: [], livros: [], refeicoes: [], fotoUrls: {}, rascunho: null,
  aba: "hoje", dia: hoje(), periodo: 30, semana: domingoDe(hoje()), inicioDados: addDias(hoje(), -400), pronto: false,
};

async function carregar() {
  const [cfg, regs, pesos, revs, livros] = await Promise.all([S.api.cfg(), S.api.regs(S.inicioDados), S.api.pesos(), S.api.revs(), S.api.livros().catch(() => [])]);
  S.livros = livros;
  S.refeicoes = await S.api.refeicoes(addDias(hoje(), -120)).catch(() => []);
  S.cfg = cfg;
  S.regs = new Map(regs.map((r) => [`${r.data}|${r.habito}`, { ...r, valor: +r.valor }]));
  S.pesos = pesos.map((p) => ({ ...p, kg: +p.kg }));
  S.revs = revs;
  S.pronto = true;
}

async function salvarReg(h, d, valor, detalhe = {}) {
  valor = Math.max(0, Math.round(valor * 100) / 100);
  const terminou = h === "leitura" ? avancarLivro(valor - (reg(d, h)?.valor || 0)) : null;
  if (terminou) setTimeout(() => toast(`🎉 Você terminou "${terminou.titulo}"!`), 50);
  if (!valor && h !== "exercicio") return apagarReg(h, d);
  const r = { data: d, habito: h, valor, detalhe, feito: calcFeito(h, valor) };
  const antes = reg(d, h);
  S.regs.set(`${d}|${h}`, r);
  render();
  if (r.feito && !antes?.feito && !terminou) celebrar(h, d);
  try { await S.api.salvarReg(r); } catch (e) { erro(e); }
}
async function apagarReg(h, d) {
  S.regs.delete(`${d}|${h}`);
  render();
  try { await S.api.apagarReg(d, h); } catch (e) { erro(e); }
}
/* ---------- Alimentação ---------- */
const TIPOS_REF = [["cafe", "☕", "Café"], ["almoco", "🍽️", "Almoço"], ["lanche", "🍎", "Lanche"], ["jantar", "🌙", "Jantar"], ["ceia", "🥛", "Ceia"]];
const tipoRef = (t) => TIPOS_REF.find((x) => x[0] === t) || TIPOS_REF[2];
function tipoPorHora() { const m = minAgora(); return m < 630 ? "cafe" : m < 900 ? "almoco" : m < 1110 ? "lanche" : m < 1320 ? "jantar" : "ceia"; }
const refsDia = (d) => S.refeicoes.filter((r) => r.data === d);
function comidoDia(d) {
  const rs = refsDia(d);
  return { n: rs.length, kcal: rs.reduce((a, r) => a + (+r.kcal || 0), 0), prot: rs.reduce((a, r) => a + (+r.proteina || 0), 0) };
}
// Taxa metabólica basal (Mifflin-St Jeor) — precisa de altura e idade
function tmb(c = S.cfg) {
  const a = c.alimentacao || {};
  if (!a.altura || !a.idade) return 0;
  return Math.round(10 * pesoAtual() + 6.25 * a.altura - 5 * a.idade + (a.sexo === "f" ? -161 : 5));
}
function sugestaoMetas(c = S.cfg) {
  const b = tmb(c);
  return { kcal: b ? Math.max(c.alimentacao?.sexo === "f" ? 1200 : 1500, Math.round((b * 1.35 - 750) / 50) * 50) : 0, proteina: Math.round((+c.peso.meta || 99) * 1.6 / 5) * 5 };
}
// Gasto do dia = basal + calorias ativas (do app Saúde)
function gastoDia(d) { const b = tmb(); return b ? b + (reg(d, "calorias")?.valor || 0) : 0; }
const fmtK = (n) => num(Math.round(n), 0);

/* ---------- Livros ---------- */
function livroAtual() {
  const lendo = S.livros.filter((l) => l.status === "lendo");
  return lendo.find((l) => l.id === S.cfg.leitura.livro_atual) || lendo[lendo.length - 1] || null;
}
// Soma (ou tira) páginas do livro atual. Devolve o livro se ele acabou agora.
function avancarLivro(delta) {
  const l = livroAtual();
  if (!l || !delta) return null;
  const nova = Math.max(0, Math.min(l.paginas || Infinity, l.pagina_atual + delta));
  const acabou = l.paginas > 0 && nova >= l.paginas;
  Object.assign(l, { pagina_atual: nova }, acabou ? { status: "lido", fim: hoje() } : {});
  S.api.salvarLivro({ ...l }).catch(erro);
  return acabou ? l : null;
}
const pctLivro = (l) => (l.paginas ? Math.min(100, Math.round((l.pagina_atual / l.paginas) * 100)) : 0);
function corLivro(t) { let x = 0; for (const ch of String(t)) x = (x * 31 + ch.charCodeAt(0)) % 360; return `linear-gradient(160deg, hsl(${x} 45% 38%), hsl(${(x + 40) % 360} 50% 22%))`; }
function capa(l, tam = "p") {
  if (l?.capa) return `<img class="capa ${tam}" src="${esc(l.capa)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  return `<div class="capa ${tam} sem" style="background:${corLivro(l?.titulo || "")}"><span>${esc(l?.titulo || "📚")}</span></div>`;
}
function ritmoLeitura() {
  let soma = 0;
  for (let i = 1; i <= 14; i++) soma += reg(addDias(hoje(), -i), "leitura")?.valor || 0;
  return soma / 14;
}
function reduzirImagem(file, max = 700) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
      cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob((b) => (b ? res(b) : rej(new Error("Não consegui ler a imagem"))), "image/jpeg", 0.85);
    };
    im.onerror = () => rej(new Error("Não consegui abrir a imagem"));
    im.src = url;
  });
}
async function buscarCapas(titulo, autor) {
  const q = `intitle:${titulo}${autor ? ` inauthor:${autor}` : ""}`;
  const out = [];
  try {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&printType=books`);
    const j = await r.json();
    for (const it of j.items || []) {
      const v = it.volumeInfo || {}, img = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail;
      if (!img) continue;
      out.push({ capa: img.replace(/^http:/, "https:").replace("&edge=curl", ""), titulo: v.title, autor: (v.authors || []).join(", "), paginas: v.pageCount || 0 });
    }
  } catch {}
  if (out.length < 3) {
    try {
      const r = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(titulo)}${autor ? `&author=${encodeURIComponent(autor)}` : ""}&limit=8&fields=title,author_name,cover_i,number_of_pages_median`);
      const j = await r.json();
      for (const d of j.docs || []) if (d.cover_i) out.push({ capa: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`, titulo: d.title, autor: (d.author_name || []).join(", "), paginas: d.number_of_pages_median || 0 });
    } catch {}
  }
  return out.slice(0, 9);
}

function celebrar(h, d) {
  const p = placarDia(d);
  if (p.ok === p.prog && p.prog) return toast("🏆 Todos os hábitos do dia!");
  const msgs = { sono: "🌙 Noite bem dormida!", leitura: "📖 Leitura do dia feita!", agua: "💧 Meta de água batida!", exercicio: "🏋️ Treino feito!", estudo: "🎓 Estudo do dia feito!" };
  toast(msgs[h] || `${info(h).emoji} ${info(h).nome}: feito!`);
}
function erro(e) { console.error(e); toast("⚠️ " + (e?.message || "Erro ao salvar. Verifique a internet.")); }

/* ============================ Componentes ============================ */
function anel(pct, tam = 108, esp = 11) {
  const r = (tam - esp) / 2, c = 2 * Math.PI * r, m = tam / 2;
  return `<svg class="anel" viewBox="0 0 ${tam} ${tam}" width="${tam}" height="${tam}">
    <circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="var(--card2)" stroke-width="${esp}"/>
    <circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="var(--acc)" stroke-width="${esp}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, pct))}" transform="rotate(-90 ${m} ${m})"/></svg>`;
}
const barra = (f) => `<div class="barra"><i style="width:${Math.min(100, Math.max(0, f * 100))}%"></i></div>`;
function topoHabito(h, sub, ok) {
  return `<div class="h-topo"><div class="h-ico">${info(h).emoji}</div><div class="h-nome"><b>${esc(info(h).nome)}</b><span>${sub}</span></div><div class="h-check">${ok ? "✓" : ""}</div></div>`;
}
const corH = (h) => `--c:${info(h).cor}`;

function cartaoHabito(h, d) {
  const c = S.cfg, r = reg(d, h), prog = programado(h, d), ok = !!r?.feito, v = r?.valor || 0;
  if (hc(h).ativo === false || (BASE.includes(h) && !c[h].ativo)) return "";
  const cls = `habito ${ok ? "ok" : ""} ${!prog && !r ? "folga" : ""}`;
  const seq = sequencia(h);
  const seqTxt = seq >= 2 ? ` · 🔥 ${seq}` : "";
  let corpo = "", sub = "";

  if (h === "sono") {
    const acordar = hm(c.sono.acordar), deitarIdeal = acordar - c.sono.meta * 60;
    sub = `Meta ${c.sono.meta}h · deitar até ${fmtMin(deitarIdeal)}${seqTxt}`;
    if (r) {
      corpo = `<div class="h-valor"><b>${horasTxt(v)}</b><span>de sono${r.detalhe?.deitou ? ` · dormiu ${fmtHora(r.detalhe.deitou)}` : ""}</span></div>${barra(v / c.sono.meta)}
        <div class="acoes"><button class="b" data-a="sonoOutro" data-d="${d}">✏️ Corrigir</button></div>`;
    } else {
      const ops = [-60, -30, 0, 30, 60].map((x) => deitarIdeal + x);
      corpo = `<p class="sub" style="margin:12px 0 0">Que horas você dormiu?</p>
        <div class="acoes">${ops.map((t) => `<button class="b min" data-a="sono" data-d="${d}" data-t="${fmtMin(t)}">${fmtMin(t)}</button>`).join("")}
        <button class="b min" data-a="sonoOutro" data-d="${d}">Outro</button></div>`;
    }
  }

  if (h === "leitura" || h === "estudo") {
    const un = h === "leitura" ? "páginas" : "min";
    const passos = h === "leitura" ? [5, 10] : [15, 30];
    sub = `${prog ? `${fmtHora(c[h].hora)} · ` : "Folga hoje · "}meta ${c[h].meta} ${un}${seqTxt}`;
    let livro = "";
    if (h === "leitura") {
      const l = livroAtual();
      livro = l ? `<button class="livro-mini" data-a="aba" data-v="estante">${capa(l, "p")}<span class="li"><b>${esc(l.titulo)}</b>
          <span>p. ${l.pagina_atual}${l.paginas ? ` de ${l.paginas}` : ""}</span>${l.paginas ? `<span class="barra fina"><i style="width:${pctLivro(l)}%"></i></span>` : ""}</span>
          ${l.paginas ? `<span class="pct-livro">${pctLivro(l)}%</span>` : ""}</button>`
        : `<button class="livro-mini vazio" data-a="novoLivro">📚 Adicionar o livro que você está lendo</button>`;
    }
    corpo = `${livro}<div class="h-valor"><b>${num(v, 0)}</b><span>/ ${c[h].meta} ${un}</span></div>${barra(v / c[h].meta)}
      <div class="acoes">${passos.map((p) => `<button class="b" data-a="somar" data-h="${h}" data-d="${d}" data-v="${p}">+${p}</button>`).join("")}
      ${!ok ? `<button class="b cor" data-a="meta" data-h="${h}" data-d="${d}">✓ ${c[h].meta}</button>` : ""}
      <button class="b min" data-a="editarNum" data-h="${h}" data-d="${d}" aria-label="Editar">✏️</button></div>`;
  }

  if (h === "agua") {
    sub = `Meta ${litros(c.agua.meta)} por dia${seqTxt}`;
    corpo = `<div class="h-valor"><b>${num(v / 1000, 2)}</b><span>/ ${litros(c.agua.meta)}</span></div>${barra(v / c.agua.meta)}
      <div class="acoes"><button class="b" data-a="somar" data-h="agua" data-d="${d}" data-v="250">+250 ml</button>
      <button class="b" data-a="somar" data-h="agua" data-d="${d}" data-v="500">+500 ml</button>
      <button class="b min" data-a="somar" data-h="agua" data-d="${d}" data-v="-250" aria-label="Desfazer">↶</button></div>`;
  }

  if (h === "exercicio") {
    const tipos = c.exercicio.tipos?.length ? c.exercicio.tipos : ["Treino"];
    const feitos = r?.detalhe?.tipos || [];
    sub = `${prog ? fmtHora(c.exercicio.hora) : "Dia livre (bônus se treinar)"}${seqTxt}`;
    const auto = r?.detalhe?.auto;
    corpo = `<div class="acoes">${tipos.map((t) => `<button class="b ${feitos.includes(t) ? "on" : ""}" data-a="treino" data-d="${d}" data-t="${esc(t)}">${feitos.includes(t) ? "✓ " : ""}${esc(t)}</button>`).join("")}</div>
      ${auto ? `<p class="sub" style="margin:10px 0 0">⌚ ${r.detalhe.auto_min ? `${r.detalhe.auto_min} min de exercício no Apple Watch` : `${auto} ${auto === 1 ? "treino registrado" : "treinos registrados"} no app Saúde`}</p>` : ""}`;
  }

  if (!H_BASE[h]) {
    const x = hc(h), un = esc(x.unidade || "");
    sub = `${prog ? (x.hora ? fmtHora(x.hora) : "Hoje") : "Folga hoje"}${x.tipo !== "check" ? ` · meta ${num(x.meta)} ${un}` : ""}${seqTxt}`;
    if (x.tipo === "check") {
      corpo = `<div class="acoes"><button class="b ${ok ? "on" : ""}" data-a="check" data-h="${h}" data-d="${d}">${ok ? "✓ Feito" : "Marcar como feito"}</button></div>`;
    } else {
      const passo = +x.passo || 1;
      corpo = `<div class="h-valor"><b>${num(v)}</b><span>/ ${num(x.meta)} ${un}</span></div>${barra(v / x.meta)}
        <div class="acoes"><button class="b" data-a="somar" data-h="${h}" data-d="${d}" data-v="${passo}">+${num(passo)}</button>
        ${!ok ? `<button class="b cor" data-a="meta" data-h="${h}" data-d="${d}">✓ ${num(x.meta)}</button>` : ""}
        <button class="b min" data-a="somar" data-h="${h}" data-d="${d}" data-v="${-passo}" aria-label="Desfazer">↶</button>
        <button class="b min" data-a="editarNum" data-h="${h}" data-d="${d}" aria-label="Editar">✏️</button></div>`;
    }
  }

  return `<section class="${cls}" style="${corH(h)}">${topoHabito(h, sub, ok)}${corpo}</section>`;
}

function cartaoPeso(d) {
  const c = S.cfg, ultimo = S.pesos[S.pesos.length - 1];
  const deHoje = S.pesos.find((p) => p.data === d);
  const diaDePesar = semDe(d) === +c.peso.dia;
  const atrasado = !ultimo || diasEntre(ultimo.data, d) >= 7;
  if (!deHoje && !diaDePesar && !atrasado) return "";
  if (d !== hoje() && !deHoje) return "";
  return `<section class="habito ${deHoje ? "ok" : ""}" style="--c:var(--peso)">
    <div class="h-topo"><div class="h-ico">⚖️</div><div class="h-nome"><b>Pesagem da semana</b><span>${deHoje ? "Registrado hoje" : "Em jejum, depois do banheiro"}</span></div><div class="h-check">${deHoje ? "✓" : ""}</div></div>
    ${deHoje ? `<div class="h-valor"><b>${num(deHoje.kg)}</b><span>kg</span></div>` : `<div class="acoes"><button class="b cor" data-a="novoPeso">Registrar peso</button></div>`}
  </section>`;
}

function cartaoComida(d) {
  const a = S.cfg.alimentacao || {};
  if (a.ativo === false) return "";
  const c = comidoDia(d), meta = +a.meta_kcal || 0, gasto = gastoDia(d);
  const passou = meta && c.kcal > meta;
  const rs = refsDia(d);
  let saldo = "";
  if (gasto && c.n) {
    const dif = c.kcal - gasto;
    saldo = `<div class="saldo ${dif <= 0 ? "bom" : "ruim"}"><span>Gasto estimado ${fmtK(gasto)} kcal</span><b>${dif <= 0 ? "Déficit" : "Superávit"} de ${fmtK(Math.abs(dif))} kcal</b></div>`;
  }
  return `<section class="habito comida ${passou ? "passou" : ""}" style="--c:#ff7eb3">
    <div class="h-topo"><div class="h-ico">🍽️</div><div class="h-nome"><b>Alimentação</b><span>${meta ? `Meta ${fmtK(meta)} kcal${a.meta_proteina ? ` · ${a.meta_proteina} g de proteína` : ""}` : "Defina sua meta em Ajustes"}</span></div></div>
    <div class="h-valor"><b>${fmtK(c.kcal)}</b><span>${meta ? `/ ${fmtK(meta)} kcal` : "kcal"}${meta ? ` · ${passou ? `<span class="desce">passou ${fmtK(c.kcal - meta)}</span>` : `restam ${fmtK(meta - c.kcal)}`}` : ""}</span></div>
    ${meta ? barra(c.kcal / meta) : ""}
    ${a.meta_proteina ? `<div class="prot"><span>🥩 Proteína ${c.prot} / ${a.meta_proteina} g</span><div class="barra fina"><i style="width:${Math.min(100, (c.prot / a.meta_proteina) * 100)}%;background:#ffb547"></i></div></div>` : ""}
    ${saldo}
    ${rs.length ? `<div class="lista-ref">${rs.map((r) => `<button class="ref" data-a="abrirRefeicao" data-id="${r.id}">
        ${r.foto && S.fotoUrls[r.foto] ? `<img src="${esc(S.fotoUrls[r.foto])}" alt="">` : `<span class="ref-ico">${tipoRef(r.tipo)[1]}</span>`}
        <span class="ref-txt"><b>${tipoRef(r.tipo)[2]}</b><span>${esc(r.descricao || (r.itens || []).map((i) => i.nome).join(", "))}</span></span>
        <span class="ref-kcal">${fmtK(r.kcal)}</span></button>`).join("")}</div>` : ""}
    <div class="acoes"><button class="b cor" data-a="novaRefeicao" data-d="${d}">+ Registrar refeição</button></div>
  </section>`;
}
async function carregarFotos() {
  const faltam = [...new Set(S.refeicoes.filter((r) => r.foto && !S.fotoUrls[r.foto] && r.data >= addDias(hoje(), -7)).map((r) => r.foto))];
  if (!faltam.length) return;
  try { Object.assign(S.fotoUrls, await S.api.urlsFotos(faltam)); render(); } catch {}
}

function cartaoSaude(d) {
  const cal = reg(d, "calorias"), pas = reg(d, "passos"), min = reg(d, "minutos"), sc = S.cfg.saude || {};
  if (!sc.chave && !cal && !pas && !min) return "";
  const em = [cal, pas, min].map((r) => r?.detalhe?.em).filter(Boolean).sort().pop();
  const item = (h, r) => {
    const meta = hc(h).meta, v = r?.valor || 0;
    return `<div class="mini" style="--c:${H_SAUDE[h].cor}"><span>${H_SAUDE[h].emoji} ${H_SAUDE[h].nome}</span>
      <b>${r ? num(v, 0) : "—"}${meta ? ` <small class="sub">/ ${num(meta, 0)}</small>` : ""}</b>${meta ? barra(v / meta) : ""}</div>`;
  };
  return `<section class="habito saude" style="--c:#ff9f43">
    <div class="h-topo"><div class="h-ico">⌚</div><div class="h-nome"><b>Atividade</b><span>${em ? `Do app Saúde · atualizado às ${new Date(em).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })}` : "Do app Saúde · ainda sem dados hoje"}</span></div></div>
    <div class="grid3">${item("calorias", cal)}${item("passos", pas)}${item("minutos", min)}</div>
    ${d === hoje() ? `<a class="b largo mt" style="height:42px;font-size:14px;text-decoration:none" href="shortcuts://run-shortcut?name=${encodeURIComponent("Rumo Saúde")}">🔄 Atualizar agora</a>` : ""}
  </section>`;
}

function faixaNotificacoes() {
  if (DEMO) return `<div class="faixa demo"><b>Modo demonstração</b>Dados de exemplo, salvos só neste aparelho.</div>`;
  const standalone = navigator.standalone || matchMedia("(display-mode: standalone)").matches;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios && !standalone) return `<div class="faixa aviso"><b>Adicione o Rumo à Tela de Início</b>No Safari, toque em Compartilhar → "Adicionar à Tela de Início" e abra pelo ícone. Só assim o iPhone mostra os lembretes.</div>`;
  if (!("Notification" in window) || !("PushManager" in window)) return `<div class="faixa aviso"><b>Este navegador não recebe lembretes</b>Use o Safari no iPhone (iOS 16.4 ou mais novo), pelo ícone da Tela de Início.</div>`;
  if (Notification.permission === "denied") return `<div class="faixa aviso"><b>Lembretes bloqueados</b>Vá em Ajustes do iPhone → Notificações → Rumo e ative "Permitir Notificações".</div>`;
  if (Notification.permission !== "granted" || !lerLocal("rumo_push_ok", false))
    return `<div class="faixa aviso"><b>Ative os lembretes</b>Para receber os avisos nos horários de cada hábito, mesmo com o celular bloqueado.<button class="b prim" data-a="ativarPush">🔔 Ativar lembretes</button></div>`;
  return "";
}

/* ============================ Telas ============================ */
function telaHoje() {
  const d = S.dia, c = S.cfg, ehHoje = d === hoje();
  const p = placarDia(d), seq = sequenciaGeral();
  const atual = pesoAtual(), perdeu = c.peso.inicial - atual, falta = Math.max(0, atual - c.peso.meta);
  const m = minAgora();
  const saud = m < 300 ? "Boa noite" : m < 720 ? "Bom dia" : m < 1080 ? "Boa tarde" : "Boa noite";
  const titulo = ehHoje ? `${saud}, ${esc(c.nome)}` : d === addDias(hoje(), -1) ? "Ontem" : dm(d);
  const rev = S.revs.find((r) => r.semana < domingoDe(d) && r.semana >= addDias(domingoDe(d), -7) && r.dados?.foco);

  let h = `<header class="topo"><div><h1>${titulo}</h1><div class="sub">${dataLonga(d)}</div></div>
    <div class="nav-dia"><button class="icone-btn" data-a="diaAnt" aria-label="Dia anterior">‹</button><button class="icone-btn" data-a="diaProx" ${ehHoje ? "disabled" : ""} aria-label="Próximo dia">›</button></div></header>`;
  if (ehHoje) h += faixaNotificacoes();
  h += `<section class="heroi"><div class="anel-box">${anel(p.pct)}<div class="num"><div><b>${Math.round(p.pct * 100)}%</b><small>${p.ok} de ${p.prog}</small></div></div></div>
    <div><h2>${p.prog && p.ok === p.prog ? "Dia completo! 🏆" : ehHoje ? "Seu dia" : "Resumo do dia"}</h2>
    <div class="sub">${falta > 0 ? `Faltam <b style="color:var(--txt)">${num(falta)} kg</b> para os ${num(c.peso.meta, 0)}` : "Meta de peso alcançada! 🎉"}</div>
    <div class="chips-linha">${seq ? `<span class="pilula acc">🔥 ${seq} ${seq === 1 ? "dia" : "dias"} no ritmo</span>` : ""}${perdeu > 0 ? `<span class="pilula">−${num(perdeu)} kg</span>` : ""}</div></div></section>`;
  if (rev) h += `<div class="foco"><span>🎯</span><div><b>Foco da semana</b>${esc(rev.dados.foco)}</div></div>`;
  h += cartaoPeso(d);
  for (const k of lista()) { h += cartaoHabito(k, d); if (k === "agua") h += cartaoComida(d); if (k === "exercicio") h += cartaoSaude(d); }
  return h;
}

function graficoPeso(ps, c) {
  if (ps.length < 2) return `<p class="sub mt">O gráfico aparece a partir da segunda pesagem.</p>`;
  const W = 320, Hh = 130, pl = 30, pr = 8, pt = 10, pb = 20;
  const ys = ps.map((p) => p.kg);
  let lo = Math.floor(Math.min(...ys) - 1), hi = Math.ceil(Math.max(...ys) + 1);
  const t0 = new Date(ps[0].data).getTime(), t1 = new Date(ps[ps.length - 1].data).getTime() || t0 + 1;
  const X = (p) => pl + ((new Date(p.data).getTime() - t0) / (t1 - t0 || 1)) * (W - pl - pr);
  const Y = (kg) => pt + ((hi - kg) / (hi - lo)) * (Hh - pt - pb);
  const linha = ps.map((p, i) => `${i ? "L" : "M"}${X(p).toFixed(1)},${Y(p.kg).toFixed(1)}`).join("");
  const area = `${linha}L${X(ps[ps.length - 1]).toFixed(1)},${Hh - pb}L${X(ps[0]).toFixed(1)},${Hh - pb}Z`;
  const marcas = [hi, Math.round((hi + lo) / 2), lo];
  return `<svg class="grafico" viewBox="0 0 ${W} ${Hh}">
    <defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--peso)" stop-opacity=".35"/><stop offset="1" stop-color="var(--peso)" stop-opacity="0"/></linearGradient></defs>
    ${marcas.map((k) => `<line x1="${pl}" x2="${W - pr}" y1="${Y(k)}" y2="${Y(k)}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${pl - 6}" y="${Y(k) + 3}" text-anchor="end">${k}</text>`).join("")}
    <path d="${area}" fill="url(#gp)"/>
    <path d="${linha}" fill="none" stroke="var(--peso)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${ps.map((p) => `<circle cx="${X(p)}" cy="${Y(p.kg)}" r="3" fill="var(--bg)" stroke="var(--peso)" stroke-width="2"/>`).join("")}
    <text x="${pl}" y="${Hh - 4}">${dm(ps[0].data)}</text><text x="${W - pr}" y="${Hh - 4}" text-anchor="end">${dm(ps[ps.length - 1].data)}</text>
  </svg>`;
}

function graficoBarras(h, de, ate) {
  const c = S.cfg, dias = [];
  for (let d = de; d <= ate; d = addDias(d, 1)) dias.push(d);
  const binario = h === "exercicio" || hc(h).tipo === "check";
  const meta = binario ? 1 : hc(h).meta || 0;
  const vals = dias.map((d) => (binario ? (reg(d, h)?.valor ? 1 : 0) : reg(d, h)?.valor || 0));
  const cor0 = info(h).cor;
  const max = Math.max(meta * 1.3, ...vals);
  const W = 320, Hh = 56, gap = dias.length > 40 ? 1 : 2, bw = (W - gap * (dias.length - 1)) / dias.length;
  const yMeta = Hh - (meta / max) * Hh;
  return `<svg class="grafico" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" style="height:56px">
    ${dias.map((d, i) => {
      const v = vals[i], hh = Math.max(v ? 3 : 2, (v / max) * Hh), ok = feito(d, h), prog = !H_SAUDE[h] && programado(h, d);
      const cor = ok ? cor0 : v ? `color-mix(in srgb, ${cor0} 40%, var(--card2))` : prog ? "rgba(255,95,109,.35)" : "var(--card2)";
      return `<rect x="${(i * (bw + gap)).toFixed(2)}" y="${(Hh - hh).toFixed(2)}" width="${bw.toFixed(2)}" height="${hh.toFixed(2)}" rx="${Math.min(3, bw / 2)}" fill="${cor}"/>`;
    }).join("")}
    ${!binario && meta ? `<line x1="0" x2="${W}" y1="${yMeta}" y2="${yMeta}" stroke="var(--txt)" stroke-opacity=".35" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>` : ""}
  </svg>`;
}

const corPct = (f) => f === null ? "var(--card2)" : f >= 1 ? "var(--acc)" : f >= 0.8 ? "#9cc443" : f >= 0.5 ? "#5d7a2e" : f > 0 ? "#38452a" : "rgba(255,95,109,.25)";

function telaProgresso() {
  const c = S.cfg, ate = hoje(), de = addDias(ate, -(S.periodo - 1));
  let h = `<header class="topo"><div><h1>Progresso</h1><div class="sub">Últimos ${S.periodo} dias</div></div></header>
    <div class="seg">${[7, 30, 90].map((p) => `<button class="${S.periodo === p ? "on" : ""}" data-a="periodo" data-v="${p}">${p} dias</button>`).join("")}</div>`;

  // Peso
  const atual = pesoAtual(), ini = +c.peso.inicial, meta = +c.peso.meta;
  const frac = Math.max(0, Math.min(1, (ini - atual) / (ini - meta)));
  const tend = tendenciaPeso();
  const marcos = [];
  for (let k = Math.floor(ini / 10) * 10; k > meta; k -= 10) if (k < ini) marcos.push(k);
  const psPeriodo = S.pesos.filter((p) => p.data >= de);
  h += `<div class="titulo-sec">Rumo aos ${num(meta, 0)} kg</div><section class="cartao">
    <div class="peso-grande"><b>${num(atual)}</b><span class="sub">kg agora</span></div>
    <div class="jornada"><i style="width:${frac * 100}%"></i>${marcos.map((k) => `<div class="marco" style="left:${((ini - k) / (ini - meta)) * 100}%"><span>${k}</span></div>`).join("")}</div>
    <div class="jornada-legenda"><span>${num(ini)} kg</span><span>${Math.round(frac * 100)}% do caminho</span><span>${num(meta)} kg</span></div>
    <div class="grid2">
      <div class="mini"><b>${ini - atual >= 0 ? "−" : "+"}${num(Math.abs(ini - atual))} kg</b><span>desde o início</span></div>
      <div class="mini"><b>${num(Math.max(0, atual - meta))} kg</b><span>para a meta</span></div>
      <div class="mini"><b>${tend ? `${tend.porSemana <= 0 ? "−" : "+"}${num(Math.abs(tend.porSemana), 2)} kg` : "—"}</b><span>por semana (ritmo)</span></div>
      <div class="mini"><b style="font-size:16px;line-height:1.5">${tend?.previsao ? mesAno(tend.previsao) : "—"}</b><span>previsão no ritmo atual</span></div>
    </div>
    ${graficoPeso(psPeriodo.length >= 2 ? psPeriodo : S.pesos.slice(-12), c)}
    <div class="acoes"><button class="b prim" data-a="novoPeso">+ Registrar peso</button><button class="b min" data-a="histPeso">Histórico</button></div>
  </section>`;

  // Consistência
  let tot = 0, okT = 0;
  for (let d = de; d <= ate; d = addDias(d, 1)) { const p = placarDia(d); tot += p.prog; okT += p.ok; }
  const ini7 = addDias(de, -((semDe(de) + 6) % 7));
  let cal = SEG_A_DOM.map((s) => `<div class="cab">${SEM_LETRA[s]}</div>`).join("");
  for (let d = ini7; d <= domingoDe(ate); d = addDias(d, 1)) {
    if (d < de || d > ate) { cal += `<div class="d vazio"></div>`; continue; }
    const p = placarDia(d);
    cal += `<div class="d ${d === ate ? "hoje" : ""}" style="background:${corPct(p.prog ? p.pct : null)};${p.pct >= 0.8 ? "color:var(--acc-txt)" : ""}" title="${dm(d)}: ${Math.round(p.pct * 100)}%">${+d.slice(8)}</div>`;
  }
  h += `<div class="titulo-sec">Consistência</div><section class="cartao">
    <div class="peso-grande"><b>${tot ? Math.round((okT / tot) * 100) : 0}%</b><span class="sub">dos hábitos cumpridos</span></div>
    <div class="cal">${cal}</div>
    <div class="legenda">menos <i style="background:${corPct(0)}"></i><i style="background:${corPct(0.4)}"></i><i style="background:${corPct(0.6)}"></i><i style="background:${corPct(0.85)}"></i><i style="background:${corPct(1)}"></i> mais</div>
  </section>`;

  // Alimentação
  const diasCom = [];
  for (let d = de; d <= ate; d = addDias(d, 1)) if (refsDia(d).length) diasCom.push(d);
  if (diasCom.length) {
    const a = c.alimentacao, meta = +a.meta_kcal || 0;
    const tot = diasCom.map((d) => comidoDia(d));
    const media = tot.reduce((x, t) => x + t.kcal, 0) / tot.length, mProt = tot.reduce((x, t) => x + t.prot, 0) / tot.length;
    const naMeta = meta ? tot.filter((t) => t.kcal <= meta).length : 0;
    const comGasto = diasCom.filter((d) => d < hoje() && gastoDia(d) && reg(d, "calorias"));
    const deficit = comGasto.length ? comGasto.reduce((x, d) => x + (gastoDia(d) - comidoDia(d).kcal), 0) / comGasto.length : null;
    const dias = []; for (let d = de; d <= ate; d = addDias(d, 1)) dias.push(d);
    const vals = dias.map((d) => comidoDia(d).kcal), max = Math.max(meta * 1.3, ...vals, 1);
    const W = 320, Hh = 56, gap = dias.length > 40 ? 1 : 2, bw = (W - gap * (dias.length - 1)) / dias.length;
    const barras = dias.map((d, i) => { const v = vals[i], hh = Math.max(v ? 3 : 2, (v / max) * Hh); const cor = !v ? "var(--card2)" : meta && v > meta ? "var(--ruim)" : "#ff7eb3";
      return `<rect x="${(i * (bw + gap)).toFixed(2)}" y="${(Hh - hh).toFixed(2)}" width="${bw.toFixed(2)}" height="${hh.toFixed(2)}" rx="${Math.min(3, bw / 2)}" fill="${cor}"/>`; }).join("");
    h += `<div class="titulo-sec">Alimentação</div><section class="cartao hab-stat" style="--c:#ff7eb3">
      <div class="h-topo"><div class="h-ico">🍽️</div><div class="h-nome"><b>Calorias consumidas</b><span>${diasCom.length} ${diasCom.length === 1 ? "dia registrado" : "dias registrados"}${meta ? ` · meta ${fmtK(meta)}` : ""}</span></div>${meta ? `<div class="pct">${Math.round((naMeta / diasCom.length) * 100)}%</div>` : ""}</div>
      <svg class="grafico" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" style="height:56px">${barras}${meta ? `<line x1="0" x2="${W}" y1="${Hh - (meta / max) * Hh}" y2="${Hh - (meta / max) * Hh}" stroke="var(--txt)" stroke-opacity=".35" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>` : ""}</svg>
      <div class="grid2"><div class="mini"><b>${fmtK(media)}</b><span>kcal por dia (média)</span></div><div class="mini"><b>${Math.round(mProt)} g</b><span>proteína por dia</span></div>
      ${deficit !== null ? `<div class="mini"><b class="${deficit >= 0 ? "sobe" : "desce"}">${deficit >= 0 ? "−" : "+"}${fmtK(Math.abs(deficit))}</b><span>${deficit >= 0 ? "déficit" : "superávit"} médio/dia</span></div>
      <div class="mini"><b>${deficit >= 0 ? "−" : "+"}${num(Math.abs(deficit * 7 / 7700), 2)} kg</b><span>por semana (estimado)</span></div>` : ""}</div></section>`;
  }

  // Atividade (app Saúde)
  const temSaude = ["calorias", "passos", "minutos"].some((k) => { for (let d = de; d <= ate; d = addDias(d, 1)) if (reg(d, k)) return true; return false; });
  if (temSaude) {
    h += `<div class="titulo-sec">Atividade · app Saúde</div>`;
    for (const k of ["calorias", "passos", "minutos"]) {
      let soma = 0, n = 0, melhor = 0, naMeta = 0;
      for (let d = de; d <= ate; d = addDias(d, 1)) { const r = reg(d, k); if (r) { soma += r.valor; n++; melhor = Math.max(melhor, r.valor); if (r.feito) naMeta++; } }
      const meta = hc(k).meta;
      h += `<section class="cartao hab-stat" style="--c:${H_SAUDE[k].cor}">
        <div class="h-topo"><div class="h-ico">${H_SAUDE[k].emoji}</div><div class="h-nome"><b>${H_SAUDE[k].nome}</b><span>${n} ${n === 1 ? "dia" : "dias"} com dados${meta ? ` · meta ${num(meta, 0)}` : ""}</span></div>${meta ? `<div class="pct">${n ? Math.round((naMeta / n) * 100) : 0}%</div>` : ""}</div>
        ${graficoBarras(k, de, ate)}
        <div class="grid2"><div class="mini"><b>${num(n ? soma / n : 0, 0)}</b><span>${H_SAUDE[k].un} por dia (média)</span></div><div class="mini"><b>${num(melhor, 0)}</b><span>melhor dia</span></div></div></section>`;
    }
  }

  // Por hábito
  h += `<div class="titulo-sec">Hábito por hábito</div>`;
  for (const k of lista()) {
    if (BASE.includes(k) && !c[k].ativo) continue;
    let prog = 0, ok = 0, soma = 0, nReg = 0;
    for (let d = de; d <= ate; d = addDias(d, 1)) {
      const r = reg(d, k);
      if (programado(k, d)) { prog++; if (r?.feito) ok++; }
      if (r) { soma += r.valor; nReg++; }
    }
    const pct = prog ? Math.round((ok / prog) * 100) : 0;
    let extra = "";
    if (k === "leitura") extra = `<div class="mini"><b>${num(soma, 0)}</b><span>páginas no total</span></div><div class="mini"><b>${num(soma / S.periodo, 1)}</b><span>páginas por dia</span></div>`;
    if (k === "estudo") extra = `<div class="mini"><b>${horasTxt(soma / 60)}</b><span>estudadas</span></div><div class="mini"><b>${num(prog ? soma / prog : 0, 0)} min</b><span>por dia de estudo</span></div>`;
    if (k === "agua") extra = `<div class="mini"><b>${litros(nReg ? soma / S.periodo : 0)}</b><span>média por dia</span></div><div class="mini"><b>${ok}</b><span>dias na meta</span></div>`;
    if (k === "sono") extra = `<div class="mini"><b>${nReg ? horasTxt(soma / nReg) : "—"}</b><span>média por noite</span></div><div class="mini"><b>${ok}</b><span>noites com ${c.sono.meta}h+</span></div>`;
    if (k === "exercicio") {
      let bonus = 0;
      for (let d = de; d <= ate; d = addDias(d, 1)) if (!programado(k, d) && feito(d, k)) bonus++;
      extra = `<div class="mini"><b>${ok + bonus}</b><span>treinos${bonus ? ` (${bonus} extra)` : ""}</span></div><div class="mini"><b>${num((ok + bonus) / (S.periodo / 7), 1)}</b><span>treinos por semana</span></div>`;
    }
    if (!H_BASE[k]) {
      const x = hc(k);
      extra = `<div class="mini"><b>${ok}</b><span>dias cumpridos</span></div>` +
        (x.tipo === "check" ? `<div class="mini"><b>${prog - ok}</b><span>dias sem fazer</span></div>` : `<div class="mini"><b>${num(soma)} ${esc(x.unidade || "")}</b><span>no total</span></div>`);
    }
    h += `<section class="cartao hab-stat" style="${corH(k)}">
      <div class="h-topo"><div class="h-ico">${info(k).emoji}</div><div class="h-nome"><b>${esc(info(k).nome)}</b><span>🔥 ${sequencia(k)} atual · melhor ${melhorSequencia(k, de, ate)}</span></div><div class="pct">${pct}%</div></div>
      ${graficoBarras(k, de, ate)}
      <div class="grid2">${extra}</div></section>`;
  }
  return h;
}

function telaEstante() {
  const lendo = S.livros.filter((l) => l.status === "lendo");
  const quero = S.livros.filter((l) => l.status === "quero");
  const lidos = S.livros.filter((l) => l.status === "lido").sort((a, b) => (b.fim || "").localeCompare(a.fim || ""));
  const ano = hoje().slice(0, 4), atual = livroAtual();
  let pagsAno = 0;
  for (const [k, r] of S.regs) if (k.startsWith(ano) && r.habito === "leitura") pagsAno += r.valor;
  const lidosAno = lidos.filter((l) => (l.fim || "").startsWith(ano)).length;
  const ritmo = ritmoLeitura();

  let h = `<header class="topo"><div><h1>Estante</h1><div class="sub">${lidosAno} ${lidosAno === 1 ? "livro lido" : "livros lidos"} em ${ano} · ${num(pagsAno, 0)} páginas</div></div>
    <button class="icone-btn" data-a="novoLivro" aria-label="Adicionar livro" style="background:var(--acc);color:var(--acc-txt);font-weight:900">+</button></header>`;

  h += `<div class="titulo-sec" style="margin-top:4px">Lendo agora</div>`;
  if (!lendo.length) h += `<section class="cartao centro"><p style="margin:4px 0 12px">Nenhum livro em leitura.</p><button class="b prim largo" data-a="novoLivro">📚 Adicionar livro</button></section>`;
  for (const l of lendo) {
    const falta = Math.max(0, (l.paginas || 0) - l.pagina_atual);
    const dias = ritmo > 0 && falta ? Math.ceil(falta / ritmo) : null;
    h += `<section class="cartao livro-grande" style="--c:var(--leitura)">${capa(l, "g")}<div class="li">
      ${lendo.length > 1 && l === atual ? `<span class="pilula acc" style="margin-bottom:6px">📖 Livro do dia</span>` : ""}
      <b class="tit">${esc(l.titulo)}</b>${l.autor ? `<span class="sub">${esc(l.autor)}</span>` : ""}
      <div class="h-valor" style="margin:10px 0 6px"><b>${l.paginas ? pctLivro(l) + "%" : "p. " + l.pagina_atual}</b><span>${l.paginas ? `p. ${l.pagina_atual} de ${l.paginas}` : ""}</span></div>
      ${l.paginas ? barra(l.pagina_atual / l.paginas) : ""}
      ${l.paginas ? `<p class="sub" style="margin:8px 0 0">Faltam ${falta} páginas${dias ? ` · uns ${dias} ${dias === 1 ? "dia" : "dias"} no seu ritmo` : ""}</p>` : ""}
      <div class="acoes"><button class="b" data-a="paginaLivro" data-id="${l.id}">📍 Estou na página…</button><button class="b min" data-a="editarLivro" data-id="${l.id}" aria-label="Editar">✏️</button></div>
      ${lendo.length > 1 && l !== atual ? `<button class="b largo mt" style="height:40px;font-size:14px" data-a="lerEste" data-id="${l.id}">Contar as páginas do dia neste livro</button>` : ""}
    </div></section>`;
  }

  if (quero.length) {
    h += `<div class="titulo-sec">Quero ler</div><div class="fila-livros">${quero.map((l) => `<button data-a="editarLivro" data-id="${l.id}">${capa(l, "m")}</button>`).join("")}</div>`;
  }

  h += `<div class="titulo-sec">Lidos · ${lidos.length}</div>`;
  if (!lidos.length) h += `<p class="sub" style="margin:0 4px">Os livros que você terminar aparecem aqui, na sua estante.</p>`;
  for (let i = 0; i < lidos.length; i += 3) {
    h += `<div class="prateleira">${lidos.slice(i, i + 3).map((l) => `<button data-a="editarLivro" data-id="${l.id}">${capa(l, "m")}<small>${l.fim ? dm(l.fim) + "/" + l.fim.slice(2, 4) : ""}</small></button>`).join("")}</div>`;
  }
  return h;
}

function modalLivro(l) {
  const novo = !l;
  l = l || { titulo: "", autor: "", paginas: "", pagina_atual: 0, capa: "", status: "lendo" };
  abrirModal(`<h3>${novo ? "📚 Novo livro" : "Editar livro"}</h3>
  <form data-form="livro" data-id="${l.id || ""}">
    <div class="livro-form-topo"><div id="capaPrev">${capa(l, "g")}</div>
      <div class="capa-botoes"><button type="button" class="b" data-a="buscarCapa">🔎 Buscar capa</button>
      <label class="b">📷 Foto da capa<input type="file" accept="image/*" hidden data-capa-arquivo></label>
      ${l.capa ? `<button type="button" class="b" data-a="tirarCapa">Remover capa</button>` : ""}</div></div>
    <div id="capaResultados" class="capa-resultados"></div>
    <input type="hidden" name="capa" value="${esc(l.capa || "")}">
    <label class="campo"><span>Título</span><input type="text" name="titulo" value="${esc(l.titulo)}" required></label>
    <label class="campo"><span>Autor</span><input type="text" name="autor" value="${esc(l.autor)}"></label>
    <div class="linha"><label class="campo"><span>Total de páginas</span><input type="number" name="paginas" min="0" inputmode="numeric" value="${l.paginas || ""}"></label>
    <label class="campo"><span>Estou na página</span><input type="number" name="pagina_atual" min="0" inputmode="numeric" value="${l.pagina_atual || 0}"></label></div>
    <div class="seg seg-form"><label><input type="radio" name="status" value="lendo" ${l.status === "lendo" ? "checked" : ""}><span>📖 Lendo</span></label>
      <label><input type="radio" name="status" value="quero" ${l.status === "quero" ? "checked" : ""}><span>🔖 Quero ler</span></label>
      <label><input type="radio" name="status" value="lido" ${l.status === "lido" ? "checked" : ""}><span>✓ Já li</span></label></div>
    <button class="b prim largo mt" type="submit">${novo ? "Adicionar à estante" : "Salvar"}</button>
    ${novo ? "" : `<button class="b perigo largo mt" type="button" data-a="apagarLivro" data-id="${l.id}">Apagar livro</button>`}
  </form>`);
}
function definirCapa(url, extra = {}) {
  const f = $("form[data-form=livro]");
  if (!f) return;
  f.elements.capa.value = url;
  $("#capaPrev").innerHTML = capa({ capa: url, titulo: f.elements.titulo.value }, "g");
  if (extra.paginas && !+f.elements.paginas.value) f.elements.paginas.value = extra.paginas;
  if (extra.autor && !f.elements.autor.value) f.elements.autor.value = extra.autor;
  $("#capaResultados").innerHTML = "";
}

function modalRefeicao(r, d) {
  S.rascunho = r ? { id: r.id, data: r.data, itens: structuredClone(r.itens || []), foto: r.foto, blob: null, b64: null, obs: "" } : { data: d || S.dia, itens: [], foto: null, blob: null, b64: null, obs: "" };
  const tipo = r?.tipo || (S.rascunho.data === hoje() ? tipoPorHora() : "almoco");
  const fotoUrl = r?.foto ? S.fotoUrls[r.foto] : null;
  abrirModal(`<h3>${r ? `${tipoRef(tipo)[1]} ${tipoRef(tipo)[2]} · ${dm(r.data)}` : "🍽️ Registrar refeição"}</h3>
  <form data-form="refeicao">
    <div class="seg seg-form tipos-ref">${TIPOS_REF.map(([k, e, n]) => `<label><input type="radio" name="tipo" value="${k}" ${k === tipo ? "checked" : ""}><span>${e}<br>${n}</span></label>`).join("")}</div>
    <label class="campo"><span>O que você comeu?</span><textarea name="texto" rows="3" placeholder="Ex.: arroz, feijão, um bife grande e salada; 1 lata de Coca">${esc(r?.descricao || "")}</textarea></label>
    <p class="sub" style="margin:-6px 0 12px">🎤 Para falar, toque no microfone do teclado.</p>
    <div class="foto-ref">
      <div id="fotoPrev">${fotoUrl ? `<img src="${esc(fotoUrl)}" alt="">` : ""}</div>
      <label class="b">📷 ${r?.foto ? "Trocar foto" : "Foto do prato"}<input type="file" accept="image/*" hidden data-foto-refeicao></label>
    </div>
    <button type="button" class="b prim largo mt" data-a="estimarRefeicao">✨ ${r ? "Estimar de novo" : "Estimar calorias"}</button>
    <div id="estimativa">${S.rascunho.itens.length ? htmlEstimativa() : ""}</div>
    <button class="b largo mt" type="submit" id="salvarRef" ${S.rascunho.itens.length ? "" : "hidden"} style="background:#ff7eb3;color:var(--acc-txt)">Salvar refeição</button>
    ${r ? `<button class="b perigo largo mt" type="button" data-a="apagarRefeicao" data-id="${r.id}">Apagar refeição</button>` : `<button type="button" class="b largo mt" data-a="refManual" style="background:none;color:var(--mut);font-size:14px">Prefiro digitar as calorias</button>`}
  </form>`);
}
function htmlEstimativa() {
  const R = S.rascunho, it = R.itens;
  const tot = it.reduce((a, i) => a + (+i.kcal || 0), 0), prot = it.reduce((a, i) => a + (+i.proteina || 0), 0);
  return `<div class="estim">
    ${it.map((i, n) => `<div class="item-ref"><div class="nome"><input type="text" value="${esc(i.nome)}" data-item="${n}" data-campo="nome"><small>${esc(i.porcao || "")}${i.proteina ? ` · ${i.proteina} g prot.` : ""}</small></div>
      <input type="number" inputmode="numeric" min="0" value="${i.kcal}" data-item="${n}" data-campo="kcal"><span class="un">kcal</span>
      <button type="button" class="x" data-a="tirarItem" data-i="${n}" aria-label="Remover">✕</button></div>`).join("")}
    <button type="button" class="b min mt" data-a="maisItem" style="font-size:14px;height:38px">+ item</button>
    <div class="total-ref"><span>Total</span><b id="totalRef">${fmtK(tot)} kcal</b></div>
    <p class="sub" style="margin:4px 0 0">🥩 ${prot} g de proteína${R.obs ? ` · ${esc(R.obs)}` : ""}</p>
  </div>`;
}
function atualizarEstimativa() {
  const box = $("#estimativa");
  if (box) box.innerHTML = S.rascunho.itens.length ? htmlEstimativa() : "";
  const b = $("#salvarRef"); if (b) b.hidden = !S.rascunho.itens.length;
}
const paraBase64 = (blob) => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });

function resumoSemana(dom) {
  const seg = addDias(dom, -6), ate = hoje() < dom ? hoje() : dom;
  let prog = 0, ok = 0;
  for (let d = seg; d <= ate; d = addDias(d, 1)) { const p = placarDia(d); prog += p.prog; ok += p.ok; }
  const ps = S.pesos.filter((p) => p.data >= seg && p.data <= dom);
  const antes = [...S.pesos].reverse().find((p) => p.data < seg);
  const ultimo = ps[ps.length - 1];
  return { pct: prog ? Math.round((ok / prog) * 100) : null, ok, prog, pesoDif: ultimo && antes ? ultimo.kg - antes.kg : null, peso: ultimo?.kg };
}

function telaSemana() {
  const c = S.cfg, dom = S.semana, seg = addDias(dom, -6), hj = hoje(), atual = dom === domingoDe(hj);
  const r = resumoSemana(dom), ant = resumoSemana(addDias(dom, -7));
  const rev = S.revs.find((x) => x.semana === dom);
  let h = `<header class="topo"><div><h1>${atual ? "Esta semana" : "Semana"}</h1><div class="sub">${dm(seg)} a ${dm(dom)}</div></div>
    <div class="nav-dia"><button class="icone-btn" data-a="semAnt">‹</button><button class="icone-btn" data-a="semProx" ${atual ? "disabled" : ""}>›</button></div></header>`;

  let t = `<table class="tabela-sem"><tr><th></th>${SEG_A_DOM.map((s, i) => `<th>${SEM_LETRA[s]}<br><span style="font-weight:500">${+addDias(seg, i).slice(8)}</span></th>`).join("")}</tr>`;
  for (const k of lista()) {
    if (BASE.includes(k) && !c[k].ativo) continue;
    t += `<tr style="${corH(k)}"><th class="hab">${info(k).emoji}</th>`;
    for (let i = 0; i < 7; i++) {
      const d = addDias(seg, i), f = feito(d, k), p = programado(k, d);
      const cls = d > hj ? "futuro" : f ? "ok" : !p ? "livre" : d === hj ? "" : "nao";
      t += `<td><div class="cel ${cls}">${f ? "✓" : cls === "nao" ? "✕" : ""}</div></td>`;
    }
    t += `</tr>`;
  }
  t += `</table>`;
  const dif = r.pct !== null && ant.pct !== null ? r.pct - ant.pct : null;
  h += `<section class="cartao">${t}
    <div class="comparativo">
      <div class="mini"><b>${r.pct ?? "—"}%</b><span>cumprido${dif !== null ? ` · <span class="${dif >= 0 ? "sobe" : "desce"}">${dif >= 0 ? "▲" : "▼"} ${Math.abs(dif)} pts</span>` : ""}</span></div>
      <div class="mini"><b>${r.pesoDif !== null ? `${r.pesoDif <= 0 ? "−" : "+"}${num(Math.abs(r.pesoDif))} kg` : r.peso ? `${num(r.peso)} kg` : "—"}</b><span>${r.pesoDif !== null ? "peso na semana" : "pesagem"}</span></div>
    </div></section>`;

  h += `<div class="titulo-sec">Revisão de domingo</div>`;
  if (rev && !S.editandoRev) {
    const dd = rev.dados || {};
    h += `<section class="cartao">
      <div style="font-size:34px">${NOTAS[(dd.nota || 3) - 1]}</div>
      ${dd.funcionou ? `<div class="rev-item"><div class="rot">O que funcionou</div><p>${esc(dd.funcionou)}</p></div>` : ""}
      ${dd.atrapalhou ? `<div class="rev-item"><div class="rot">O que atrapalhou</div><p>${esc(dd.atrapalhou)}</p></div>` : ""}
      ${dd.foco ? `<div class="rev-item"><div class="rot">🎯 Foco da próxima semana</div><p>${esc(dd.foco)}</p></div>` : ""}
      <button class="b mt largo" data-a="editarRev">✏️ Editar revisão</button></section>`;
  } else {
    const dd = rev?.dados || {};
    const ehDomingo = semDe(hj) === 0;
    h += `<form class="cartao" data-form="revisao">
      ${atual && !ehDomingo ? `<p class="sub" style="margin-top:0">O ideal é fazer no domingo, às ${fmtHora(c.revisao.hora)}. Você recebe um lembrete.</p>` : ""}
      <label class="campo"><span>Como foi a semana?</span><div class="notas">${NOTAS.map((e, i) => `<label><input type="radio" name="nota" value="${i + 1}" ${(dd.nota || 0) === i + 1 ? "checked" : ""}><span>${e}</span></label>`).join("")}</div></label>
      <label class="campo"><span>O que funcionou?</span><textarea name="funcionou" placeholder="Ex.: treinar logo depois do trabalho">${esc(dd.funcionou)}</textarea></label>
      <label class="campo"><span>O que atrapalhou?</span><textarea name="atrapalhou" placeholder="Ex.: dormi tarde no fim de semana">${esc(dd.atrapalhou)}</textarea></label>
      <label class="campo"><span>🎯 Foco da próxima semana</span><input type="text" name="foco" value="${esc(dd.foco)}" placeholder="Uma coisa só, ex.: deitar até 23h"></label>
      <div class="titulo-sec" style="margin:18px 0 10px">Metas da próxima semana</div>
      <div class="linha"><label class="campo"><span>📖 Páginas/dia</span><input type="number" name="leitura.meta" min="1" value="${c.leitura.meta}"></label>
      <label class="campo"><span>🎓 Estudo (min)</span><input type="number" name="estudo.meta" min="5" step="1" value="${c.estudo.meta}"></label></div>
      <div class="linha"><label class="campo"><span>💧 Água (litros)</span><input type="text" inputmode="decimal" autocomplete="off" name="agua.litros" value="${num(c.agua.meta / 1000, 2)}"></label>
      <label class="campo"><span>🌙 Sono (horas)</span><input type="text" inputmode="decimal" autocomplete="off" name="sono.meta" value="${num(c.sono.meta)}"></label></div>
      <label class="campo" style="--c:var(--exercicio)"><span>🏋️ Dias de treino</span>${seletorDias("exercicio.dias", c.exercicio.dias)}</label>
      <button class="b prim largo mt" type="submit">Salvar revisão</button>
      ${rev ? `<button class="b largo mt" type="button" data-a="cancelarRev">Cancelar</button>` : ""}
    </form>`;
  }

  const antigas = S.revs.filter((x) => x.semana !== dom).slice(0, 8);
  if (antigas.length) {
    h += `<div class="titulo-sec">Revisões anteriores</div><section class="cartao">`;
    for (const x of antigas) {
      const dd = x.dados || {};
      h += `<div class="rev-item"><div class="rot">${dm(addDias(x.semana, -6))} a ${dm(x.semana)} · ${NOTAS[(dd.nota || 3) - 1]}${dd.pct != null ? ` · ${dd.pct}%` : ""}</div>${dd.foco ? `<p>🎯 ${esc(dd.foco)}</p>` : ""}</div>`;
    }
    h += `</section>`;
  }
  return h;
}

function diasTxt(d) {
  if (!Array.isArray(d) || d.length === 7) return "todo dia";
  if (d.join() === "1,2,3,4,5") return "seg a sex";
  if (d.join() === "1,2,3,4,5,6") return "seg a sáb";
  return SEG_A_DOM.filter((s) => d.includes(s)).map((s) => SEM_NOME[s].slice(0, 3).toLowerCase()).join(", ");
}
function modalHabito(x) {
  const novo = !x;
  x = x || { emoji: "🧘", cor: CORES[7], tipo: "check", meta: 1, unidade: "", passo: 1, hora: "", dias: [0, 1, 2, 3, 4, 5, 6], ativo: true };
  abrirModal(`<h3>${novo ? "Novo hábito" : "Editar hábito"}</h3>
  <form data-form="habito" data-id="${x.id || ""}" class="form-hab" style="--c:${x.cor}">
    <label class="campo"><span>Nome</span><input type="text" name="nome" value="${esc(x.nome)}" placeholder="Ex.: Meditar, Tomar vitaminas" required maxlength="40"></label>
    <label class="campo"><span>Ícone</span></label><div class="grade-icones">${ICONES.map((e) => `<label><input type="radio" name="emoji" value="${e}" ${e === x.emoji ? "checked" : ""}><span>${e}</span></label>`).join("")}</div>
    <label class="campo mt"><span>Cor</span></label><div class="grade-cores">${CORES.map((cor) => `<label><input type="radio" name="cor" value="${cor}" ${cor === x.cor ? "checked" : ""}><span style="background:${cor}"></span></label>`).join("")}</div>
    <label class="campo mt"><span>Como marcar</span></label>
    <div class="seg seg-form"><label><input type="radio" name="tipo" value="check" ${x.tipo === "check" ? "checked" : ""}><span>✓ Feito / não feito</span></label>
      <label><input type="radio" name="tipo" value="qtd" ${x.tipo !== "check" ? "checked" : ""}><span>🔢 Com quantidade</span></label></div>
    <div class="so-qtd"><div class="linha"><label class="campo"><span>Meta por dia</span><input type="number" name="meta" min="0.1" step="any" value="${x.meta || 1}"></label>
      <label class="campo"><span>Unidade</span><input type="text" name="unidade" value="${esc(x.unidade)}" placeholder="min, copos, vezes"></label></div>
      <label class="campo"><span>Quanto soma cada toque no botão +</span><input type="number" name="passo" min="0.1" step="any" value="${x.passo || 1}"></label></div>
    <label class="campo"><span>Horário do lembrete (deixe vazio para não ter lembrete)</span><input type="time" name="hora" value="${x.hora || ""}"></label>
    <label class="campo"><span>Dias</span>${seletorDias("dias", x.dias)}</label>
    ${novo ? "" : chave("ativo", x.ativo !== false, "Ativo (desligue para pausar sem apagar)")}
    <button class="b prim largo mt" type="submit">${novo ? "Criar hábito" : "Salvar"}</button>
    ${novo ? "" : `<button class="b perigo largo mt" type="button" data-a="apagarHabito" data-id="${x.id}">Apagar hábito</button>`}
  </form>`);
}

function seletorDias(nome, sel) {
  return `<div class="dias">${SEG_A_DOM.map((s) => `<label><input type="checkbox" name="${nome}" value="${s}" ${(sel || []).includes(s) ? "checked" : ""}><span>${SEM_LETRA[s]}</span></label>`).join("")}</div>`;
}
const chave = (nome, on, rot = "Ativo") => `<label class="campo chave"><span style="margin:0">${rot}</span><input type="checkbox" name="${nome}" ${on ? "checked" : ""}></label>`;

function telaAjustes() {
  const c = S.cfg;
  const bloco = (k, conteudo) => `<details class="aj" style="${corH(k)}"><summary><span class="h-ico">${info(k).emoji}</span>${info(k).nome}</summary><div class="corpo">${conteudo}</div></details>`;
  let h = `<header class="topo"><div><h1>Ajustes</h1><div class="sub">Metas, horários e lembretes</div></div></header>`;
  h += faixaNotificacoes();
  if (!DEMO && typeof Notification !== "undefined" && Notification.permission === "granted" && lerLocal("rumo_push_ok", false))
    h += `<button class="b largo" data-a="testarPush" style="margin-bottom:14px">🔔 Enviar notificação de teste</button>`;
  const extras = c.extras || [];
  h += `<div class="titulo-sec" style="margin-top:4px">Seus hábitos</div><section class="cartao">
    ${extras.length ? extras.map((x) => `<button class="item-hab" data-a="editarHabito" data-id="${x.id}" style="--c:${x.cor}">
      <span class="h-ico">${x.emoji}</span><span class="h-nome"><b>${esc(x.nome)}${x.ativo === false ? " <small class=sub>(pausado)</small>" : ""}</b>
      <span>${x.tipo === "check" ? "Sim/não" : `${num(x.meta)} ${esc(x.unidade || "")}`}${x.hora ? ` · ${fmtHora(x.hora)}` : " · sem lembrete"} · ${diasTxt(x.dias)}</span></span><span class="sub">✏️</span></button>`).join("")
      : `<p class="sub" style="margin:0 0 4px">Crie hábitos além dos cinco principais: meditar, não fumar, tomar vitaminas…</p>`}
    <button class="b prim largo mt" data-a="novoHabito">+ Novo hábito</button></section>
    <div class="titulo-sec">Hábitos principais</div>`;
  h += `<form data-form="ajustes" novalidate>
    <section class="cartao"><label class="campo" style="margin:0"><span>Seu nome</span><input type="text" name="nome" value="${esc(c.nome)}"></label></section>
    ${bloco("sono", `${chave("sono.ativo", c.sono.ativo)}
      <div class="linha"><label class="campo"><span>Acordar às</span><input type="time" name="sono.acordar" value="${c.sono.acordar}"></label>
      <label class="campo"><span>Meta (horas)</span><input type="text" inputmode="decimal" autocomplete="off" name="sono.meta" value="${num(c.sono.meta)}"></label></div>
      <label class="campo"><span>Avisar para desacelerar (min antes de deitar)</span><input type="number" name="sono.aviso_antes_min" min="0" step="1" value="${c.sono.aviso_antes_min}"></label>
      <p class="sub">Com essa meta, o horário de deitar é ${fmtMin(hm(c.sono.acordar) - c.sono.meta * 60)}.</p>`)}
    ${bloco("leitura", `${chave("leitura.ativo", c.leitura.ativo)}
      <div class="linha"><label class="campo"><span>Páginas por dia</span><input type="number" name="leitura.meta" min="1" value="${c.leitura.meta}"></label>
      <label class="campo"><span>Lembrete</span><input type="time" name="leitura.hora" value="${c.leitura.hora}"></label></div>
      <label class="campo"><span>Dias</span>${seletorDias("leitura.dias", c.leitura.dias)}</label>`)}
    ${bloco("agua", `${chave("agua.ativo", c.agua.ativo)}
      <label class="campo"><span>Meta (litros por dia)</span><input type="text" inputmode="decimal" autocomplete="off" name="agua.litros" value="${num(c.agua.meta / 1000, 2)}"></label>
      <div class="linha"><label class="campo"><span>Das</span><input type="time" name="agua.inicio" value="${c.agua.inicio}"></label>
      <label class="campo"><span>Até</span><input type="time" name="agua.fim" value="${c.agua.fim}"></label></div>
      <label class="campo"><span>Verificar a cada (min)</span><input type="number" name="agua.intervalo_min" min="30" step="1" value="${c.agua.intervalo_min}"></label>
      <p class="sub">O lembrete só chega se você estiver abaixo do ritmo para bater a meta.</p>`)}
    ${bloco("exercicio", `${chave("exercicio.ativo", c.exercicio.ativo)}
      <label class="campo"><span>Lembrete</span><input type="time" name="exercicio.hora" value="${c.exercicio.hora}"></label>
      <label class="campo"><span>Dias de treino</span>${seletorDias("exercicio.dias", c.exercicio.dias)}</label>
      <label class="campo"><span>Tipos (separe por vírgula)</span><input type="text" name="exercicio.tipos" value="${esc((c.exercicio.tipos || []).join(", "))}"></label>`)}
    ${bloco("estudo", `${chave("estudo.ativo", c.estudo.ativo)}
      <div class="linha"><label class="campo"><span>Minutos por dia</span><input type="number" name="estudo.meta" min="5" step="1" value="${c.estudo.meta}"></label>
      <label class="campo"><span>Lembrete</span><input type="time" name="estudo.hora" value="${c.estudo.hora}"></label></div>
      <label class="campo"><span>Dias</span>${seletorDias("estudo.dias", c.estudo.dias)}</label>`)}
    <details class="aj" style="--c:#ff7eb3"><summary><span class="h-ico">🍽️</span>Alimentação</summary><div class="corpo">
      ${chave("alimentacao.ativo", c.alimentacao.ativo !== false, "Mostrar na tela Hoje")}
      <p class="sub" style="margin-top:0">Com altura e idade, o app calcula seu gasto diário (basal + calorias ativas do Saúde) e o déficit do dia.</p>
      <div class="linha"><label class="campo"><span>Altura (cm)</span><input type="number" name="alimentacao.altura" min="100" max="230" value="${c.alimentacao.altura || ""}"></label>
      <label class="campo"><span>Idade</span><input type="number" name="alimentacao.idade" min="12" max="100" value="${c.alimentacao.idade || ""}"></label>
      <label class="campo"><span>Sexo</span><select name="alimentacao.sexo"><option value="m" ${c.alimentacao.sexo !== "f" ? "selected" : ""}>M</option><option value="f" ${c.alimentacao.sexo === "f" ? "selected" : ""}>F</option></select></label></div>
      <div class="linha"><label class="campo"><span>Meta (kcal/dia)</span><input type="number" name="alimentacao.meta_kcal" min="0" step="1" value="${c.alimentacao.meta_kcal || ""}"></label>
      <label class="campo"><span>Proteína (g/dia)</span><input type="number" name="alimentacao.meta_proteina" min="0" step="1" value="${c.alimentacao.meta_proteina || ""}"></label></div>
      ${(() => { const sg = sugestaoMetas(); return sg.kcal ? `<p class="sub">Sugestão para perder cerca de 0,7 kg por semana: <b style="color:var(--txt)">${fmtK(sg.kcal)} kcal</b> e <b style="color:var(--txt)">${sg.proteina} g de proteína</b> (basal ${fmtK(tmb())} kcal).</p>` : ""; })()}
      <button type="button" class="b largo" data-a="usarSugestao">🎯 Calcular e usar sugestão</button>
      <p class="sub" style="margin-bottom:0">É uma estimativa. Para um plano sob medida, vale conversar com um nutricionista.</p>
    </div></details>
    <details class="aj" style="--c:#ff9f43"><summary><span class="h-ico">⌚</span>App Saúde</summary><div class="corpo">
      <p class="sub" style="margin-top:0">Calorias ativas, passos e minutos de exercício chegam do app Saúde pelo app Atalhos. Quando os minutos passam do limite abaixo, o Treino do dia é marcado sozinho.</p>
      <div class="linha"><label class="campo"><span>Meta de calorias (kcal)</span><input type="number" name="saude.meta_calorias" min="0" step="1" value="${c.saude.meta_calorias || ""}" placeholder="opcional"></label>
      <label class="campo"><span>Meta de passos</span><input type="number" name="saude.meta_passos" min="0" step="1" value="${c.saude.meta_passos || ""}" placeholder="opcional"></label></div>
      <label class="campo"><span>Minutos de exercício para contar como Treino</span><input type="number" name="saude.min_treino" min="1" step="1" value="${c.saude.min_treino || 20}"></label>
      <button type="button" class="b largo" data-a="configSaude">📲 Configurar o atalho</button>
    </div></details>
    <details class="aj" style="--c:var(--peso)"><summary><span class="h-ico">⚖️</span>Peso e revisão</summary><div class="corpo">
      <div class="linha"><label class="campo"><span>Peso inicial (kg)</span><input type="text" inputmode="decimal" autocomplete="off" name="peso.inicial" value="${num(c.peso.inicial)}"></label>
      <label class="campo"><span>Meta (kg)</span><input type="text" inputmode="decimal" autocomplete="off" name="peso.meta" value="${num(c.peso.meta)}"></label></div>
      <div class="linha"><label class="campo"><span>Dia da pesagem</span><select name="peso.dia">${SEG_A_DOM.map((s) => `<option value="${s}" ${+c.peso.dia === s ? "selected" : ""}>${SEM_NOME[s]}</option>`).join("")}</select></label>
      <label class="campo"><span>Horário</span><input type="time" name="peso.hora" value="${c.peso.hora}"></label></div>
      <div class="linha"><label class="campo"><span>Dia da revisão</span><select name="revisao.dia">${SEG_A_DOM.map((s) => `<option value="${s}" ${+c.revisao.dia === s ? "selected" : ""}>${SEM_NOME[s]}</option>`).join("")}</select></label>
      <label class="campo"><span>Horário</span><input type="time" name="revisao.hora" value="${c.revisao.hora}"></label></div>
      <label class="campo"><span>Fechamento do dia (aviso do que falta)</span><input type="time" name="fechamento" value="${c.fechamento}"></label>
    </div></details>
    <button class="b prim largo mt" type="submit">Salvar ajustes</button>
  </form>
  ${DEMO ? `<button class="b largo mt" data-a="resetDemo">Recomeçar demonstração</button>` : `<button class="b perigo largo mt" data-a="sair">Sair da conta</button>`}
  <p class="sub centro mt">Rumo · feito para ${esc(c.nome)}</p>`;
  return h;
}

function telaLogin(msg = "") {
  return `<div class="login"><div class="logo">Rumo</div><p class="sub" style="margin:0 0 24px">Seus hábitos, um dia de cada vez.</p>
    <form data-form="login">
      ${msg ? `<div class="erro">${esc(msg)}</div>` : ""}
      <label class="campo"><span>E-mail</span><input type="email" name="email" autocomplete="username" required></label>
      <label class="campo"><span>Senha</span><input type="password" name="senha" autocomplete="current-password" required></label>
      <button class="b prim largo" type="submit">Entrar</button>
    </form></div>`;
}

/* ============================ Render ============================ */
function render() {
  if (!S.pronto) return;
  const telas = { hoje: telaHoje, progresso: telaProgresso, estante: telaEstante, semana: telaSemana, ajustes: telaAjustes };
  const abas = [["hoje", "☀️", "Hoje"], ["progresso", "📈", "Progresso"], ["estante", "📚", "Estante"], ["semana", "🗓️", "Semana"], ["ajustes", "⚙️", "Ajustes"]];
  const abertos = [...document.querySelectorAll("details.aj[open]")].map((d) => d.querySelector("summary").textContent);
  $("#app").innerHTML = telas[S.aba]() +
    `<nav class="abas"><div class="in">${abas.map(([k, i, n]) => `<button class="${S.aba === k ? "on" : ""}" data-a="aba" data-v="${k}"><span class="i">${i}</span>${n}</button>`).join("")}</div></nav>`;
  document.querySelectorAll("details.aj").forEach((d) => { if (abertos.includes(d.querySelector("summary").textContent)) d.open = true; });
}

function abrirModal(html) {
  const m = $("#modal");
  m.innerHTML = `<div class="folha"><div class="pega"></div>${html}</div>`;
  m.hidden = false;
  const f = m.querySelector("input:not([type=hidden])");
  if (f) setTimeout(() => f.focus(), 120);
}
function fecharModal() { $("#modal").hidden = true; $("#modal").innerHTML = ""; }

/* ============================ Ações ============================ */
const ACOES = {
  aba(el) { S.aba = el.dataset.v; S.editandoRev = false; if (S.aba === "hoje") S.dia = hoje(); render(); scrollTo(0, 0); },
  diaAnt() { S.dia = addDias(S.dia, -1); render(); },
  diaProx() { if (S.dia < hoje()) { S.dia = addDias(S.dia, 1); render(); } },
  semAnt() { S.semana = addDias(S.semana, -7); S.editandoRev = false; render(); },
  semProx() { if (S.semana < domingoDe(hoje())) { S.semana = addDias(S.semana, 7); S.editandoRev = false; render(); } },
  periodo(el) { S.periodo = +el.dataset.v; render(); },
  somar(el) {
    const { h, d } = el.dataset, r = reg(d, h);
    salvarReg(h, d, (r?.valor || 0) + +el.dataset.v, r?.detalhe || {});
  },
  meta(el) { const { h, d } = el.dataset; salvarReg(h, d, Math.max(hc(h).meta, reg(d, h)?.valor || 0), reg(d, h)?.detalhe || {}); },
  check(el) { const { h, d } = el.dataset; if (feito(d, h)) apagarReg(h, d); else salvarReg(h, d, 1); },
  editarNum(el) {
    const { h, d } = el.dataset, un = h === "leitura" ? "páginas" : h === "estudo" ? "minutos" : (hc(h).unidade || "unidades");
    abrirModal(`<h3>${info(h).emoji} ${esc(info(h).nome)} · ${dm(d)}</h3><form data-form="num" data-h="${h}" data-d="${d}">
      <label class="campo"><span>Quantas ${un}?</span><input type="number" name="v" min="0" inputmode="numeric" value="${reg(d, h)?.valor || ""}"></label>
      <button class="b prim largo" type="submit">Salvar</button></form>`);
  },
  sono(el) {
    const { d, t } = el.dataset;
    const horas = (((hm(S.cfg.sono.acordar) - hm(t)) % 1440) + 1440) % 1440 / 60;
    salvarReg("sono", d, horas, { deitou: t, acordou: S.cfg.sono.acordar });
  },
  sonoOutro(el) {
    const d = el.dataset.d, r = reg(d, "sono");
    abrirModal(`<h3>🌙 Noite de ${dm(addDias(d, -1))} para ${dm(d)}</h3><form data-form="sono" data-d="${d}">
      <div class="linha"><label class="campo"><span>Dormi às</span><input type="time" name="deitou" value="${r?.detalhe?.deitou || fmtMin(hm(S.cfg.sono.acordar) - S.cfg.sono.meta * 60)}" required></label>
      <label class="campo"><span>Acordei às</span><input type="time" name="acordou" value="${r?.detalhe?.acordou || S.cfg.sono.acordar}" required></label></div>
      <button class="b prim largo" type="submit">Salvar</button>
      ${r ? `<button class="b perigo largo mt" type="button" data-a="apagarSono" data-d="${d}">Apagar registro</button>` : ""}</form>`);
  },
  apagarSono(el) { fecharModal(); apagarReg("sono", el.dataset.d); },
  treino(el) {
    const { d, t } = el.dataset, r = reg(d, "exercicio"), auto = r?.detalhe?.auto;
    let tipos = [...(r?.detalhe?.tipos || [])];
    tipos = tipos.includes(t) ? tipos.filter((x) => x !== t) : [...tipos, t];
    if (!tipos.length && !auto) return apagarReg("exercicio", d);
    salvarReg("exercicio", d, Math.max(tipos.length, auto ? 1 : 0), { tipos, ...(auto ? { auto } : {}) });
  },
  novoPeso() {
    const ult = S.pesos[S.pesos.length - 1];
    abrirModal(`<h3>⚖️ Registrar peso</h3><form data-form="peso">
      <label class="campo"><span>Peso (kg)</span><input type="text" name="kg" inputmode="decimal" autocomplete="off" placeholder="${ult ? num(ult.kg) : S.cfg.peso.inicial}" required></label>
      <label class="campo"><span>Data</span><input type="date" name="data" value="${hoje()}" max="${hoje()}" required></label>
      <button class="b prim largo" type="submit">Salvar</button></form>`);
  },
  histPeso() {
    const lista = [...S.pesos].reverse();
    abrirModal(`<h3>Histórico de peso</h3>${lista.length ? `<ul class="lista-peso">${lista.map((p, i) => {
      const prox = lista[i + 1], dif = prox ? p.kg - prox.kg : null;
      return `<li><span><b>${num(p.kg)} kg</b> <span class="sub">${dm(p.data)}${dif !== null ? ` · <span class="${dif <= 0 ? "sobe" : "desce"}">${dif <= 0 ? "−" : "+"}${num(Math.abs(dif))}</span>` : ""}</span></span><button class="b min perigo" data-a="apagarPeso" data-id="${p.id}" aria-label="Apagar">✕</button></li>`;
    }).join("")}</ul>` : `<p class="sub">Nenhuma pesagem ainda.</p>`}`);
  },
  async apagarPeso(el) {
    const id = +el.dataset.id;
    if (el.dataset.conf !== "1") { el.dataset.conf = "1"; el.textContent = "Apagar?"; return; }
    try { await S.api.apagarPeso(id); S.pesos = S.pesos.filter((p) => +p.id !== id); render(); ACOES.histPeso(); toast("Pesagem apagada"); } catch (e) { erro(e); }
  },
  novaRefeicao(el) { modalRefeicao(null, el.dataset.d); },
  abrirRefeicao(el) { modalRefeicao(S.refeicoes.find((r) => String(r.id) === el.dataset.id)); },
  async estimarRefeicao(el) {
    const f = $("form[data-form=refeicao]"), texto = f.elements.texto.value.trim();
    if (!texto && !S.rascunho.b64) return toast("Descreva a refeição ou tire uma foto");
    el.disabled = true; el.textContent = "✨ Estimando…";
    try {
      const r = await S.api.estimar({ texto, imagem: S.rascunho.b64 || undefined, tipo: tipoRef(f.elements.tipo.value)[2] });
      if (!$("#estimativa")) return;
      S.rascunho.itens = r.itens || []; S.rascunho.obs = r.observacao || "";
      if (!S.rascunho.itens.length) toast(r.observacao || "Não reconheci comida aí");
      atualizarEstimativa();
    } catch (e) { erro(e); }
    el.disabled = false; el.textContent = "✨ Estimar de novo";
  },
  refManual() { S.rascunho.itens = [{ nome: $("form[data-form=refeicao]").elements.texto.value.trim() || "Refeição", porcao: "", kcal: 0, proteina: 0, carbo: 0, gordura: 0 }]; atualizarEstimativa(); $("#estimativa input[data-campo=kcal]")?.focus(); },
  tirarItem(el) { S.rascunho.itens.splice(+el.dataset.i, 1); atualizarEstimativa(); },
  maisItem() { S.rascunho.itens.push({ nome: "", porcao: "", kcal: 0, proteina: 0, carbo: 0, gordura: 0 }); atualizarEstimativa(); $$last("#estimativa input[data-campo=nome]")?.focus(); },
  async apagarRefeicao(el) {
    if (el.dataset.conf !== "1") { el.dataset.conf = "1"; el.textContent = "Toque de novo para apagar"; return; }
    const r = S.refeicoes.find((x) => String(x.id) === el.dataset.id);
    try { await S.api.apagarRefeicao(r); S.refeicoes = S.refeicoes.filter((x) => x !== r); fecharModal(); render(); toast("Refeição apagada"); } catch (e) { erro(e); }
  },
  usarSugestao() {
    const f = $("form[data-form=ajustes]"), c = structuredClone(S.cfg);
    aplicarCampos(c, f, new FormData(f), ["alimentacao.altura", "alimentacao.idade", "alimentacao.sexo"]);
    const s = sugestaoMetas(c);
    if (!s.kcal) return toast("Preencha altura e idade primeiro");
    f.elements["alimentacao.meta_kcal"].value = s.kcal; f.elements["alimentacao.meta_proteina"].value = s.proteina;
    toast("Sugestão aplicada. Toque em Salvar ajustes.");
  },
  novoLivro() { modalLivro(null); },
  editarLivro(el) { modalLivro(S.livros.find((l) => String(l.id) === el.dataset.id)); },
  tirarCapa() { definirCapa(""); },
  async buscarCapa() {
    const f = $("form[data-form=livro]"), t = f.elements.titulo.value.trim();
    if (!t) return toast("Escreva o título primeiro");
    const box = $("#capaResultados");
    box.innerHTML = `<p class="sub">Buscando…</p>`;
    const rs = await buscarCapas(t, f.elements.autor.value.trim());
    if (!$("#capaResultados")) return;
    box.innerHTML = rs.length
      ? `<p class="sub" style="margin:0 0 8px">Toque na capa certa:</p><div class="grade-capas">${rs.map((r) => `<button type="button" data-a="escolherCapa" data-url="${esc(r.capa)}" data-pag="${r.paginas || ""}" data-autor="${esc(r.autor || "")}"><img src="${esc(r.capa)}" alt="" referrerpolicy="no-referrer"><small>${r.paginas ? r.paginas + " p." : ""}</small></button>`).join("")}</div>`
      : `<p class="sub">Não encontrei. Tente só o título, ou use 📷 Foto da capa.</p>`;
  },
  escolherCapa(el) { definirCapa(el.dataset.url, { paginas: +el.dataset.pag, autor: el.dataset.autor }); },
  async apagarLivro(el) {
    if (el.dataset.conf !== "1") { el.dataset.conf = "1"; el.textContent = "Toque de novo para apagar"; return; }
    const id = +el.dataset.id;
    try { await S.api.apagarLivro(id); S.livros = S.livros.filter((l) => +l.id !== id); fecharModal(); render(); toast("Livro apagado"); } catch (e) { erro(e); }
  },
  paginaLivro(el) {
    const l = S.livros.find((x) => String(x.id) === el.dataset.id);
    abrirModal(`<h3>📍 ${esc(l.titulo)}</h3><form data-form="paginaLivro" data-id="${l.id}">
      <label class="campo"><span>Em que página você está?${l.paginas ? ` (de ${l.paginas})` : ""}</span><input type="number" name="p" min="0" ${l.paginas ? `max="${l.paginas}"` : ""} inputmode="numeric" value="${l.pagina_atual}"></label>
      ${chave("somar", true, "Somar as páginas novas na leitura de hoje")}
      <button class="b prim largo" type="submit">Salvar</button></form>`);
  },
  async lerEste(el) {
    const c = structuredClone(S.cfg);
    c.leitura.livro_atual = +el.dataset.id || el.dataset.id;
    try { await S.api.salvarCfg(c); S.cfg = mesclarCfg(c); render(); toast("📖 As páginas do dia vão para este livro"); } catch (e) { erro(e); }
  },
  async configSaude() {
    let c = S.cfg;
    if (!c.saude?.chave) {
      c = structuredClone(S.cfg);
      const a = new Uint8Array(24); crypto.getRandomValues(a);
      c.saude = { ...(c.saude || {}), chave: [...a].map((b) => b.toString(16).padStart(2, "0")).join("") };
      try { await S.api.salvarCfg(c); S.cfg = mesclarCfg(c); } catch (e) { return erro(e); }
    }
    const end = `${URL_SAUDE}?chave=${S.cfg.saude.chave}`;
    abrirModal(`<h3>📲 Atalho "Rumo Saúde"</h3>
      <p class="sub" style="margin-top:0">Faça uma vez só, no app <b>Atalhos</b> do iPhone. Depois ele roda sozinho.</p>
      <label class="campo"><span>Seu endereço pessoal (não compartilhe)</span><input type="text" readonly value="${end}" id="endSaude"></label>
      <button class="b prim largo" data-a="copiarSaude">📋 Copiar endereço</button>
      <ol class="passos">
        <li>No app <b>Atalhos</b>, toque em <b>+</b> e dê o nome <b>Rumo Saúde</b>.</li>
        <li>Adicione <b>Buscar Amostras de Saúde</b> (busque por "amostras"). Configure: <b>Tipo</b> é <b>Energia Ativa</b>, <b>Data de Início</b> é <b>Hoje</b>, e <b>Agrupar por: Dia</b>.</li>
        <li>Adicione <b>Calcular Estatísticas</b> → <b>Soma</b>.</li>
        <li>Repita os passos 2 e 3 com o tipo <b>Passos</b>.</li>
        <li>Repita os passos 2 e 3 com o tipo <b>Minutos de Exercício</b> (Exercise Minutes), unidade <b>min</b>.</li>
        <li>Adicione <b>Obter Conteúdo do URL</b>. Cole o endereço copiado. Em <b>Mostrar Mais</b>: Método <b>POST</b>, Corpo da Solicitação <b>JSON</b>, e adicione 3 campos do tipo <b>Número</b>:
          <br>• <code>calorias</code> = Estatísticas (a 1ª)
          <br>• <code>passos</code> = Estatísticas (a 2ª)
          <br>• <code>minutos</code> = Estatísticas (a 3ª)</li>
        <li>(Opcional) Adicione <b>Mostrar Notificação</b> com o <b>Conteúdo do URL</b>, para ver "✅ Rumo atualizado".</li>
        <li>Rode o atalho uma vez e permita o acesso ao Saúde. Os números aparecem no Rumo.</li>
        <li>Para rodar sozinho: aba <b>Automação</b> → <b>+</b> → <b>Hora do Dia</b> → <b>23:30</b>, <b>Diariamente</b>, marque <b>Executar Imediatamente</b> e escolha <b>Rumo Saúde</b>. Se quiser ver ao longo do dia, crie outras automações (ex.: 12:00 e 19:00).</li>
      </ol>
      <p class="sub">💡 Na primeira vez, compare as calorias com o app Saúde. Se o número vier maior, abra os passos 2 e 4 e adicione o filtro <b>Fonte</b> é <b>seu Apple Watch</b>.</p>`);
  },
  async copiarSaude() {
    const v = $("#endSaude").value;
    try { await navigator.clipboard.writeText(v); toast("📋 Endereço copiado"); }
    catch { $("#endSaude").select(); toast("Toque e segure para copiar"); }
  },
  novoHabito() { modalHabito(null); },
  editarHabito(el) { modalHabito((S.cfg.extras || []).find((x) => x.id === el.dataset.id)); },
  async apagarHabito(el) {
    if (el.dataset.conf !== "1") { el.dataset.conf = "1"; el.textContent = "Toque de novo para apagar (o histórico some do app)"; return; }
    const c = structuredClone(S.cfg);
    c.extras = (c.extras || []).filter((x) => x.id !== el.dataset.id);
    try { await S.api.salvarCfg(c); S.cfg = mesclarCfg(c); fecharModal(); render(); toast("Hábito apagado"); } catch (e) { erro(e); }
  },
  editarRev() { S.editandoRev = true; render(); },
  cancelarRev() { S.editandoRev = false; render(); },
  async ativarPush() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { render(); return toast("Notificações não permitidas"); }
      const reg_ = await navigator.serviceWorker.ready;
      let sub = await reg_.pushManager.getSubscription();
      if (!sub) sub = await reg_.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(CONFIG.VAPID_PUBLIC_KEY) });
      await S.api.salvarSub(sub);
      gravarLocal("rumo_push_ok", true);
      render();
      toast("🔔 Lembretes ativados!");
    } catch (e) { erro(e); }
  },
  async testarPush() {
    try {
      const r = await navigator.serviceWorker.ready;
      const sub = await r.pushManager.getSubscription();
      if (!sub) { gravarLocal("rumo_push_ok", false); render(); return toast("Ative os lembretes de novo"); }
      await S.api.salvarSub(sub);
      await S.api.teste();
      toast("Enviado! Chega em até 1 minuto.");
    } catch (e) { erro(e); }
  },
  async sair() { await S.sb.auth.signOut(); localStorage.removeItem("rumo_push_ok"); location.reload(); },
  resetDemo() { Object.keys(localStorage).filter((k) => k.startsWith("rumo_demo_")).forEach((k) => localStorage.removeItem(k)); location.reload(); },
};

const FORMS = {
  async login(f, fd) {
    const b = f.querySelector("button"); b.disabled = true; b.textContent = "Entrando…";
    const { error } = await S.sb.auth.signInWithPassword({ email: fd.get("email").trim(), password: fd.get("senha") });
    if (error) { $("#app").innerHTML = telaLogin("E-mail ou senha incorretos."); return; }
    iniciarSessao();
  },
  num(f, fd) { fecharModal(); salvarReg(f.dataset.h, f.dataset.d, +fd.get("v") || 0, reg(f.dataset.d, f.dataset.h)?.detalhe || {}); },
  sono(f, fd) {
    const de = hm(fd.get("deitou")), ate = hm(fd.get("acordou"));
    const horas = (((ate - de) % 1440) + 1440) % 1440 / 60;
    fecharModal();
    salvarReg("sono", f.dataset.d, horas, { deitou: fd.get("deitou"), acordou: fd.get("acordou") });
  },
  async peso(f, fd) {
    const kg = Math.round(parseFloat(String(fd.get("kg")).replace(",", ".")) * 10) / 10, data = fd.get("data");
    if (!(kg >= 30 && kg <= 300)) return toast("Peso inválido");
    try {
      await S.api.salvarPeso(data, kg);
      S.pesos = (await S.api.pesos()).map((p) => ({ ...p, kg: +p.kg }));
      fecharModal(); render();
      const ant = S.pesos.filter((p) => p.data < data).pop();
      toast(ant && kg < ant.kg ? `⚖️ −${num(ant.kg - kg)} kg! Bora!` : "⚖️ Peso registrado");
    } catch (e) { erro(e); }
  },
  async revisao(f, fd) {
    const c = structuredClone(S.cfg);
    aplicarCampos(c, f, fd, ["leitura.meta", "estudo.meta", "agua.litros", "sono.meta", "exercicio.dias"]);
    const r = resumoSemana(S.semana);
    const dados = { nota: +fd.get("nota") || 3, funcionou: fd.get("funcionou").trim(), atrapalhou: fd.get("atrapalhou").trim(), foco: fd.get("foco").trim(), pct: r.pct,
      metas: { leitura: c.leitura.meta, estudo: c.estudo.meta, agua: c.agua.meta, sono: c.sono.meta, treino_dias: c.exercicio.dias.length } };
    try {
      await S.api.salvarRev(S.semana, dados);
      await S.api.salvarCfg(c);
      S.cfg = mesclarCfg(c);
      S.revs = await S.api.revs();
      S.editandoRev = false;
      render(); scrollTo(0, 0);
      toast("📋 Revisão salva. Boa semana!");
    } catch (e) { erro(e); }
  },
  async refeicao(f, fd) {
    const R = S.rascunho;
    const itens = R.itens.filter((i) => i.nome.trim() || +i.kcal).map((i) => ({ ...i, nome: i.nome.trim() || "Item", kcal: Math.max(0, Math.round(+i.kcal || 0)) }));
    if (!itens.length) return toast("Estime ou digite as calorias primeiro");
    const btn = $("#salvarRef"); btn.disabled = true; btn.textContent = "Salvando…";
    try {
      let foto = R.foto;
      if (R.blob) foto = await S.api.subirFotoRefeicao(R.blob);
      const soma = (k) => itens.reduce((a, i) => a + (+i[k] || 0), 0);
      const r = { ...(R.id ? { id: R.id } : {}), data: R.data, tipo: fd.get("tipo") || "lanche", descricao: fd.get("texto").trim(), foto, itens,
        kcal: soma("kcal"), proteina: soma("proteina"), carbo: soma("carbo"), gordura: soma("gordura") };
      const salvo = await S.api.salvarRefeicao(r);
      if (R.blob) S.fotoUrls[foto] = DEMO ? foto : URL.createObjectURL(R.blob);
      S.refeicoes = [...S.refeicoes.filter((x) => x.id !== salvo.id), salvo].sort((a, b) => (a.criado_em || "").localeCompare(b.criado_em || ""));
      fecharModal(); render();
      const tot = comidoDia(R.data).kcal, meta = +S.cfg.alimentacao.meta_kcal || 0;
      toast(`🍽️ +${fmtK(r.kcal)} kcal · ${meta ? (tot <= meta ? `restam ${fmtK(meta - tot)} hoje` : `passou ${fmtK(tot - meta)} da meta`) : `${fmtK(tot)} no dia`}`);
    } catch (e) { erro(e); btn.disabled = false; btn.textContent = "Salvar refeição"; }
  },
  async livro(f, fd) {
    const antigo = S.livros.find((l) => String(l.id) === f.dataset.id);
    const status = fd.get("status") || "lendo";
    const paginas = parseInt(fd.get("paginas")) || 0;
    let pagina_atual = Math.max(0, parseInt(fd.get("pagina_atual")) || 0);
    if (paginas) pagina_atual = Math.min(paginas, pagina_atual);
    const l = {
      ...(antigo || {}),
      titulo: fd.get("titulo").trim(), autor: fd.get("autor").trim(), paginas, capa: fd.get("capa") || null, status,
      pagina_atual: status === "lido" && paginas ? paginas : pagina_atual,
    };
    if (!l.titulo) return toast("Escreva o título");
    if (status === "lendo" && !l.inicio) l.inicio = hoje();
    if (status === "lido") l.fim = l.fim || hoje(); else l.fim = null;
    try {
      const salvo = await S.api.salvarLivro(l);
      S.livros = [...S.livros.filter((x) => x.id !== salvo.id), salvo].sort((a, b) => (a.criado_em || "").localeCompare(b.criado_em || ""));
      if (status === "lendo" && (!antigo || antigo.status !== "lendo")) {
        const c = structuredClone(S.cfg); c.leitura.livro_atual = salvo.id;
        await S.api.salvarCfg(c); S.cfg = mesclarCfg(c);
      }
      fecharModal(); render();
      toast(status === "lido" && antigo?.status !== "lido" ? `🎉 "${l.titulo}" na estante!` : "📚 Livro salvo");
    } catch (e) { erro(e); }
  },
  async paginaLivro(f, fd) {
    const l = S.livros.find((x) => String(x.id) === f.dataset.id);
    const nova = Math.max(0, Math.min(l.paginas || Infinity, parseInt(fd.get("p")) || 0));
    const delta = nova - l.pagina_atual;
    fecharModal();
    if (f.elements.somar.checked && delta > 0) {
      if (livroAtual()?.id !== l.id) { const c = structuredClone(S.cfg); c.leitura.livro_atual = l.id; S.cfg = mesclarCfg(c); S.api.salvarCfg(c).catch(erro); }
      const r = reg(hoje(), "leitura");
      return salvarReg("leitura", hoje(), (r?.valor || 0) + delta, r?.detalhe || {});
    }
    const acabou = l.paginas && nova >= l.paginas;
    Object.assign(l, { pagina_atual: nova }, acabou ? { status: "lido", fim: hoje() } : {});
    render();
    toast(acabou ? `🎉 Você terminou "${l.titulo}"!` : "📍 Página atualizada");
    try { await S.api.salvarLivro({ ...l }); } catch (e) { erro(e); }
  },
  async habito(f, fd) {
    const c = structuredClone(S.cfg);
    const id = f.dataset.id || "x" + Date.now().toString(36);
    const antigo = (c.extras || []).find((x) => x.id === id) || {};
    const x = {
      ...antigo, id, criado: antigo.criado || hoje(),
      nome: fd.get("nome").trim(),
      emoji: fd.get("emoji") || "⭐",
      cor: fd.get("cor") || CORES[0],
      tipo: fd.get("tipo") === "check" ? "check" : "qtd",
      meta: parseFloat(String(fd.get("meta")).replace(",", ".")) || 1,
      unidade: fd.get("unidade").trim(),
      passo: parseFloat(String(fd.get("passo")).replace(",", ".")) || 1,
      hora: fd.get("hora") || "",
      dias: fd.getAll("dias").map(Number).sort(),
      ativo: f.elements.ativo ? f.elements.ativo.checked : true,
    };
    if (!x.nome) return toast("Dê um nome ao hábito");
    if (!x.dias.length) return toast("Escolha pelo menos um dia");
    c.extras = [...(c.extras || []).filter((e) => e.id !== id), x];
    try { await S.api.salvarCfg(c); S.cfg = mesclarCfg(c); fecharModal(); render(); toast(f.dataset.id ? "✅ Hábito atualizado" : `${x.emoji} Hábito criado!`); } catch (e) { erro(e); }
  },
  async ajustes(f, fd) {
    const c = structuredClone(S.cfg);
    c.nome = fd.get("nome").trim() || "Você";
    const campos = [...new Set([...f.elements].map((e) => e.name).filter((n) => n && n !== "nome"))];
    for (const n of ["peso.inicial", "peso.meta"]) {
      const v = parseFloat(String(fd.get(n)).replace(",", "."));
      if (!(v > 20 && v < 400)) return toast("Confira o peso: use só números, ex.: 137,5");
    }
    aplicarCampos(c, f, fd, campos);
    try { await S.api.salvarCfg(c); S.cfg = mesclarCfg(c); render(); toast("✅ Ajustes salvos"); } catch (e) { erro(e); }
  },
};

// Lê campos "grupo.chave" do formulário para dentro da configuração
function aplicarCampos(c, f, fd, nomes) {
  for (const n of nomes) {
    const [g, k] = n.includes(".") ? n.split(".") : [null, n];
    const el = f.elements[n];
    const tipo = el instanceof RadioNodeList ? el[0].type : el.type;
    let v;
    if (k === "dias") v = fd.getAll(n).map(Number).sort();
    else if (tipo === "checkbox") v = el.checked;
    else if (k === "litros") { if (g) c[g].meta = Math.round(parseFloat(String(fd.get(n)).replace(",", ".")) * 1000) || c[g].meta; continue; }
    else if (k === "tipos") v = String(fd.get(n)).split(",").map((s) => s.trim()).filter(Boolean);
    else if (g === "saude" && fd.get(n) === "") v = k === "min_treino" ? 20 : 0;
    else if (g === "alimentacao" && fd.get(n) === "") v = 0;
    else if (k === "sexo") v = fd.get(n);
    else if (tipo === "number" || tipo === "select-one" || el.inputMode === "decimal") v = parseFloat(String(fd.get(n)).replace(",", "."));
    else v = fd.get(n);
    if (typeof v === "number" && isNaN(v)) continue;
    if (g) c[g] = { ...c[g], [k]: v }; else c[k] = v;
  }
}

document.addEventListener("click", (e) => {
  if (e.target.id === "modal") return fecharModal();
  const el = e.target.closest("[data-a]");
  if (!el || el.disabled) return;
  const fn = ACOES[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el); }
});
document.addEventListener("change", async (e) => {
  if (e.target.matches("[data-foto-refeicao]") && e.target.files[0]) {
    try {
      const blob = await reduzirImagem(e.target.files[0], 1024);
      S.rascunho.blob = blob; S.rascunho.b64 = await paraBase64(blob);
      $("#fotoPrev").innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`;
      toast("📷 Foto pronta. Toque em Estimar calorias.");
    } catch (err) { erro(err); }
    return;
  }
  if (!e.target.matches("[data-capa-arquivo]") || !e.target.files[0]) return;
  try {
    toast("Enviando capa…");
    const blob = await reduzirImagem(e.target.files[0]);
    definirCapa(await S.api.subirCapa(blob));
    toast("📷 Capa adicionada");
  } catch (err) { erro(err); }
});
document.addEventListener("input", (e) => {
  const el = e.target;
  if (!el.dataset || el.dataset.item === undefined || !S.rascunho) return;
  const i = S.rascunho.itens[+el.dataset.item];
  if (el.dataset.campo === "nome") { i.nome = el.value; return; }
  const novo = Math.max(0, +el.value || 0), antigo = +i.kcal || 0;
  if (antigo > 0) { const k = novo / antigo; for (const m of ["proteina", "carbo", "gordura"]) i[m] = Math.round((+i[m] || 0) * k); }
  i.kcal = novo;
  const t = $("#totalRef"); if (t) t.textContent = fmtK(S.rascunho.itens.reduce((a, x) => a + (+x.kcal || 0), 0)) + " kcal";
});
document.addEventListener("submit", (e) => {
  const f = e.target.closest("[data-form]");
  if (!f) return;
  e.preventDefault();
  FORMS[f.dataset.form]?.(f, new FormData(f));
});

/* ============================ Início ============================ */
async function iniciarSessao() {
  try {
    if (!DEMO) {
      const { data } = await S.sb.auth.getUser();
      S.api = apiSupabase(S.sb, data.user.id);
    }
    await carregar();
    render();
    carregarFotos();
  } catch (e) {
    console.error(e);
    $("#app").innerHTML = `<div class="login"><div class="logo">Rumo</div><p>Não foi possível carregar seus dados.</p><p class="sub">${esc(e?.message || e)}</p><button class="b prim largo" onclick="location.reload()">Tentar de novo</button></div>`;
  }
}

async function iniciar() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  if (DEMO) { S.api = apiLocal(); return iniciarSessao(); }
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  S.sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "rumo-auth" } });
  const { data } = await S.sb.auth.getSession();
  if (!data.session) { $("#app").innerHTML = telaLogin(); return; }
  iniciarSessao();
}

// Ao voltar para o app: atualiza os dados e, se virou o dia, volta para hoje
let ultimaVisita = hoje();
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible" || !S.pronto || !$("#modal").hidden) return;
  if (ultimaVisita !== hoje()) { ultimaVisita = hoje(); S.dia = hoje(); S.semana = domingoDe(hoje()); }
  try { await carregar(); render(); carregarFotos(); } catch {}
});

iniciar();
