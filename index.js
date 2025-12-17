const express = require("express");
const app = express();

app.use(express.json());

// rota que o Helius vai usar
app.post("/helius", (req, res) => {
  console.log("Webhook recebido do Helius");
  res.status(200).send("ok");
});

// rota só para teste no navegador
app.get("/", (req, res) => {
  res.send("Servidor online");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
