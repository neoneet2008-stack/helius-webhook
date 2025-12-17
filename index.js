const express = require("express");
const app = express();

app.use(express.json());

// ====== CONFIG DO SEU FILTRO ======
const MIN_USD = 1000;

// Mints (Solana) mais comuns pra excluir (você pode completar depois)
const EXCLUDED_MINTS = new Set([
  // WSOL (wSOL)
  "So11111111111111111111111111111111111111112",
  // USDC (main)
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  // USDT (main)
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
]);

function isExcludedMint(mint) {
  if (!mint) return false;
  return EXCLUDED_MINTS.has(mint);
}

function pickSwapCandidateMint(enhancedTx) {
  // Heurística: pega o "token não-excluído" que aparece nas transfers
  // (Helius enhanced costuma trazer tokenTransfers)
  const tts = enhancedTx?.tokenTransfers || [];
  for (const t of tts) {
    const mint = t?.mint;
    if (mint && !isExcludedMint(mint)) return mint;
  }
  return null;
}

function getUsdValue(enhancedTx) {
  // Alguns payloads trazem "usdValue"/"tokenTransfers[].usdValue"/etc.
  // Tentamos achar o maior valor USD dentro do evento.
  let best = 0;

  if (typeof enhancedTx?.usdValue === "number") best = Math.max(best, enhancedTx.usdValue);

  const tts = enhancedTx?.tokenTransfers || [];
  for (const t of tts) {
    if (typeof t?.usdValue === "number") best = Math.max(best, t.usdValue);
  }

  // fallback: às vezes vem "nativeTransfers" (SOL) com usdValue
  const nts = enhancedTx?.nativeTransfers || [];
  for (const n of nts) {
    if (typeof n?.usdValue === "number") best = Math.max(best, n.usdValue);
  }

  return best;
}

app.post("/helius", (req, res) => {
  // responde rápido pro Helius
  res.status(200).send("ok");

  try {
    // Helius pode mandar array de transações (com enhanced)
    const body = req.body;
    const list = Array.isArray(body) ? body : [body];

    for (const tx of list) {
      // 1) pegar um valor USD estimado (se existir)
      const usd = getUsdValue(tx);

      // 2) pegar o token candidato (não USDC/USDT/WSOL)
      const candidateMint = pickSwapCandidateMint(tx);

      // 3) aplicar filtros
      const passesUsd = usd >= MIN_USD;
      const passesMint = candidateMint && !isExcludedMint(candidateMint);

      if (!passesMint) {
        // log curto (não spam)
        console.log(`[IGNORADO] sem token candidato (provavelmente só base). usd=${usd || 0}`);
        continue;
      }

      if (!passesUsd) {
        console.log(`[IGNORADO] token=${candidateMint} usd=${usd || 0} (< ${MIN_USD})`);
        continue;
      }

      // 4) PASSOU NO FILTRO
      console.log("✅ PASSOU NO FILTRO");
      console.log(`token_mint=${candidateMint}`);
      console.log(`usd=${usd}`);

      // (mais pra frente: aqui entra análise Jupiter + Telegram)
    }
  } catch (e) {
    console.error("Erro no webhook:", e);
  }
});

app.get("/", (req, res) => res.send("Servidor online"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
