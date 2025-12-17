app.post("/helius", (req, res) => {
  try {
    const payload = req.body;

    // sempre responde rápido pro Helius
    res.status(200).send("ok");

    // loga o evento inteiro (pra gente entender o formato)
    console.log("=== WEBHOOK HELIUS ===");
    console.log(JSON.stringify(payload, null, 2));
  } catch (e) {
    console.error("Erro no webhook:", e);
    res.status(200).send("ok");
  }
});
