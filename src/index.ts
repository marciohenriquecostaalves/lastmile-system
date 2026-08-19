import express from "express";
import { ordersRouter } from "./orders/routes";
import { routingRouter } from "./routing/routes";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Sistema Last Mile rodando" });
});

app.use("/orders", ordersRouter);
app.use("/routes", routingRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
