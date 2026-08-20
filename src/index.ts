import express from "express";
import path from "path";
import { ordersRouter } from "./orders/routes";
import { routingRouter } from "./routing/routes";
import { driversRouter } from "./drivers/routes";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Sistema Last Mile rodando" });
});

app.use("/orders", ordersRouter);
app.use("/routes", routingRouter);
app.use("/drivers", driversRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
