// =====================================================================
//  Função "saude" (Supabase → Edge Functions) — app Rumo
//  Recebe do app Atalhos do iPhone os dados do app Saúde:
//    POST .../functions/v1/saude?chave=SUA_CHAVE
//    corpo JSON: { "calorias": 520, "passos": 8432, "minutos": 45 }
//  Grava calorias ativas, passos e minutos de exercício do dia. Se os
//  minutos passarem do limite (padrão 20) ou vier "treinos" > 0,
//  marca o Treino do dia como feito.
// =====================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const TZ = "America/Sao_Paulo";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function hojeSP() {
  const o: Record<string, string> = {};
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date()).forEach((p) => (o[p.type] = p.value));
  return `${o.year}-${o.month}-${o.day}`;
}
// Aceita 520, "520", "520,4", "8.432", "8432 passos"
function numero(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  let s = String(v).replace(/[^\d.,-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}
const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
const texto = (t: string, status = 200) => new Response(t, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let corpo: any = {};
  try { corpo = await req.json(); } catch { /* sem corpo */ }
  const chave = url.searchParams.get("chave") || corpo.chave;
  if (!chave || String(chave).length < 20) return texto("❌ Chave ausente. Confira o endereço no atalho.", 401);

  const { data: achados } = await sb.from("h_config").select("user_id,dados").eq("dados->saude->>chave", chave).limit(1);
  const conta = achados?.[0];
  if (!conta) return texto("❌ Chave inválida. Copie o endereço de novo em Rumo → Ajustes → App Saúde.", 401);

  const uid = conta.user_id, saude = conta.dados?.saude || {};
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(corpo.data || "") ? corpo.data : hojeSP();
  const em = new Date().toISOString();
  const calorias = numero(corpo.calorias), passos = numero(corpo.passos), treinos = numero(corpo.treinos), minutos = numero(corpo.minutos);
  const limiar = +saude.min_treino || 20;
  const linhas: any[] = [];
  const partes: string[] = [];

  if (calorias !== null && calorias >= 0) {
    const meta = +saude.meta_calorias || 0;
    linhas.push({ user_id: uid, data: dia, habito: "calorias", valor: Math.round(calorias), feito: meta ? calorias >= meta : true, detalhe: { em, fonte: "saude" }, atualizado: em });
    partes.push(`${fmt(calorias)} kcal`);
  }
  if (passos !== null && passos >= 0) {
    const meta = +saude.meta_passos || 0;
    linhas.push({ user_id: uid, data: dia, habito: "passos", valor: Math.round(passos), feito: meta ? passos >= meta : true, detalhe: { em, fonte: "saude" }, atualizado: em });
    partes.push(`${fmt(passos)} passos`);
  }
  if (minutos !== null && minutos >= 0) {
    linhas.push({ user_id: uid, data: dia, habito: "minutos", valor: Math.round(minutos), feito: minutos >= limiar, detalhe: { em, fonte: "saude" }, atualizado: em });
    partes.push(`${fmt(minutos)} min de exercício`);
  }
  if (linhas.length) {
    const { error } = await sb.from("h_registros").upsert(linhas);
    if (error) return texto("❌ Erro ao salvar: " + error.message, 500);
  }

  // Treinos registrados no Saúde marcam o Treino do dia
  if (treinos !== null || minutos !== null) {
    const n = Math.max(0, Math.round(treinos ?? 0), minutos !== null && minutos >= limiar ? 1 : 0);
    const { data: atual } = await sb.from("h_registros").select("valor,detalhe").eq("user_id", uid).eq("data", dia).eq("habito", "exercicio").maybeSingle();
    const tipos: string[] = atual?.detalhe?.tipos || [];
    if (n > 0) {
      await sb.from("h_registros").upsert({ user_id: uid, data: dia, habito: "exercicio", valor: Math.max(tipos.length, 1), feito: true, detalhe: { ...(atual?.detalhe || {}), tipos, auto: n, ...(minutos !== null ? { auto_min: Math.round(minutos) } : {}) }, atualizado: em });
      partes.push("Treino ✓");
    } else if (atual?.detalhe?.auto) {
      if (tipos.length) await sb.from("h_registros").update({ valor: tipos.length, detalhe: { tipos }, atualizado: em }).eq("user_id", uid).eq("data", dia).eq("habito", "exercicio");
      else await sb.from("h_registros").delete().eq("user_id", uid).eq("data", dia).eq("habito", "exercicio");
    } else partes.push(minutos !== null ? `treino conta a partir de ${limiar} min` : "nenhum treino ainda");
  }

  if (!partes.length) return texto("⚠️ Nada recebido. Confira os campos calorias, passos e treinos no atalho.", 400);
  return texto(`✅ Rumo atualizado: ${partes.join(" · ")}`);
});
