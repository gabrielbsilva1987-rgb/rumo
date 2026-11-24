// =====================================================================
//  Função "comida" (Supabase → Edge Functions) — app Rumo
//  Recebe a descrição e/ou a foto de uma refeição e devolve a estimativa
//  de calorias e macros por item, usando a API da Anthropic (Claude).
//  Só aceita usuários logados no Rumo (JWT verificado pelo Supabase).
//  Segredo necessário: ANTHROPIC_API_KEY
//  Opcionais: RUMO_MODELO_TEXTO, RUMO_MODELO_FOTO
// =====================================================================
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const MODELOS_TEXTO = [Deno.env.get("RUMO_MODELO_TEXTO"), "claude-haiku-5-5", "claude-sonnet-5-5"].filter(Boolean) as string[];
const MODELOS_FOTO = [Deno.env.get("RUMO_MODELO_FOTO"), "claude-sonnet-5-5", "claude-haiku-5-5"].filter(Boolean) as string[];

const SISTEMA = `Você é um nutricionista brasileiro que estima calorias de refeições a partir de descrições informais e/ou fotos.
Regras:
- Use porções e preparos típicos do Brasil (tabela TACO/IBGE como referência). Ex.: "uma concha de feijão" ≈ 140 g; "colher de servir de arroz" ≈ 45 g; "pão francês" = 50 g.
- Quando a quantidade não for dita, assuma uma porção média de adulto e diga qual porção assumiu.
- Considere óleo/manteiga de preparo quando fizer sentido (frituras, refogados).
- Bebidas contam (refrigerante, suco, cerveja, café com açúcar).
- Separe em itens. Números inteiros. Seja realista, sem arredondar tudo para baixo.
- Se houver foto, estime pelo tamanho visível do prato e dos alimentos; combine com o texto se houver.
- Se a descrição não for comida, devolva itens vazios e explique na observação.
Sempre responda chamando a ferramenta registrar_refeicao.`;

const FERRAMENTA = {
  name: "registrar_refeicao",
  description: "Registra a estimativa nutricional da refeição, item por item.",
  input_schema: {
    type: "object",
    properties: {
      itens: {
        type: "array",
        items: {
          type: "object",
          properties: {
            nome: { type: "string", description: "Alimento, em português" },
            porcao: { type: "string", description: "Porção assumida, ex.: '4 col. de sopa (100 g)'" },
            kcal: { type: "integer" },
            proteina: { type: "integer", description: "gramas" },
            carbo: { type: "integer", description: "gramas" },
            gordura: { type: "integer", description: "gramas" },
          },
          required: ["nome", "porcao", "kcal", "proteina", "carbo", "gordura"],
        },
      },
      observacao: { type: "string", description: "Uma frase curta: suposições feitas ou dica rápida (opcional)" },
      confianca: { type: "string", enum: ["alta", "media", "baixa"] },
    },
    required: ["itens", "confianca"],
  },
};

async function chamar(modelo: string, conteudo: unknown[], chave: string) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 1500,
      system: SISTEMA,
      tools: [FERRAMENTA],
      tool_choice: { type: "tool", name: "registrar_refeicao" },
      messages: [{ role: "user", content: conteudo }],
    }),
  });
  const corpo = await r.json().catch(() => ({}));
  return { status: r.status, corpo };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const chave = Deno.env.get("ANTHROPIC_API_KEY");
  if (!chave) return json({ erro: "A chave da IA ainda não foi configurada no servidor." }, 503);

  let entrada: any = {};
  try { entrada = await req.json(); } catch { return json({ erro: "Pedido inválido." }, 400); }
  const texto = String(entrada.texto || "").slice(0, 1500).trim();
  const imagem = typeof entrada.imagem === "string" ? entrada.imagem : ""; // base64 JPEG, sem prefixo
  if (!texto && !imagem) return json({ erro: "Descreva a refeição ou mande uma foto." }, 400);
  if (imagem.length > 4_500_000) return json({ erro: "Foto muito grande." }, 413);

  const conteudo: unknown[] = [];
  if (imagem) conteudo.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imagem } });
  conteudo.push({ type: "text", text: texto ? `Refeição (${entrada.tipo || "refeição"}): ${texto}` : `Estime a refeição da foto (${entrada.tipo || "refeição"}).` });

  let ultimoErro = "";
  for (const modelo of imagem ? MODELOS_FOTO : MODELOS_TEXTO) {
    const { status, corpo } = await chamar(modelo, conteudo, chave);
    if (status === 200) {
      const uso = (corpo.content || []).find((c: any) => c.type === "tool_use");
      const d = uso?.input || {};
      const itens = (Array.isArray(d.itens) ? d.itens : []).map((i: any) => ({
        nome: String(i.nome || "").slice(0, 80), porcao: String(i.porcao || "").slice(0, 80),
        kcal: Math.max(0, Math.round(+i.kcal || 0)), proteina: Math.max(0, Math.round(+i.proteina || 0)),
        carbo: Math.max(0, Math.round(+i.carbo || 0)), gordura: Math.max(0, Math.round(+i.gordura || 0)),
      }));
      return json({ itens, observacao: d.observacao || "", confianca: d.confianca || "media", modelo });
    }
    ultimoErro = corpo?.error?.message || `erro ${status}`;
    console.error("IA falhou", modelo, status, ultimoErro);
    if (status === 401) return json({ erro: "A chave da IA é inválida. Confira o segredo ANTHROPIC_API_KEY." }, 502);
    if (status === 400 && /credit|billing|balance/i.test(ultimoErro)) return json({ erro: "Sem créditos na conta da API da Anthropic." }, 502);
    if (status !== 404 && !/model/i.test(ultimoErro)) break; // só tenta outro modelo se o problema for o modelo
  }
  return json({ erro: "Não consegui estimar agora: " + ultimoErro }, 502);
});
