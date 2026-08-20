import "dotenv/config";
import express from "express";
import path from "path";
import session from "express-session";
import { ordersRouter } from "./orders/routes";
import { routingRouter } from "./routing/routes";
import { driversRouter } from "./drivers/routes";
import { authRouter } from "./auth/routes";
import { exigirAutenticacaoApi, exigirAutenticacaoPagina } from "./auth/middleware";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "troque-esta-frase",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Sistema Last Mile rodando" });
});

app.use("/auth", authRouter);

app.get("/", exigirAutenticacaoPagina, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "dashboard.html"));
});

app.use("/orders", exigirAutenticacaoApi, ordersRouter);
app.use("/routes", exigirAutenticacaoApi, routingRouter);
app.use("/drivers", exigirAutenticacaoApi, driversRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
