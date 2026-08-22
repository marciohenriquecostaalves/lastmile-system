import "dotenv/config";
import express from "express";
import path from "path";
import session from "express-session";
import { ordersRouter } from "./orders/routes";
import { routingRouter } from "./routing/routes";
import { driversRouter } from "./drivers/routes";
import { authRouter } from "./auth/routes";
import { motoristaRouter } from "./motorista/routes";
import { filiaisRouter } from "./filiais/routes";
import { usuariosRouter } from "./usuarios/routes";
import { notificacoesRouter } from "./notificacoes/routes";
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

function servirPagina(nomeArquivo: string) {
  return (req: express.Request, res: express.Response) => {
    res.sendFile(path.join(__dirname, "..", "views", nomeArquivo));
  };
}

app.get("/", exigirAutenticacaoPagina, servirPagina("inicio.html"));
app.get("/pedidos", exigirAutenticacaoPagina, servirPagina("pedidos.html"));
app.get("/motoristas", exigirAutenticacaoPagina, servirPagina("motoristas-lista.html"));
app.get("/rotas", exigirAutenticacaoPagina, servirPagina("rotas.html"));
app.get("/usuarios", exigirAutenticacaoPagina, servirPagina("usuarios.html"));
app.get("/filiais", exigirAutenticacaoPagina, servirPagina("filiais.html"));

app.get("/motorista/:driverId", servirPagina("motorista.html"));

app.use("/orders", exigirAutenticacaoApi, ordersRouter);
app.use("/routes", exigirAutenticacaoApi, routingRouter);
app.use("/drivers", exigirAutenticacaoApi, driversRouter);
app.use("/motorista", motoristaRouter);
app.use("/api/filiais", exigirAutenticacaoApi, filiaisRouter);
app.use("/api/usuarios", exigirAutenticacaoApi, usuariosRouter);
app.use("/api/notificacoes", exigirAutenticacaoApi, notificacoesRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
