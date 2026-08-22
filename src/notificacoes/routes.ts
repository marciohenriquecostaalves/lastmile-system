import { Router } from "express";
import { listarNotificacoes, marcarComoLida, contarNaoLidas } from "./store";

export const notificacoesRouter = Router();

const PAPEIS_VISAO_GLOBAL = ["gerente", "torre_controle"];

notificacoesRouter.get("/", async (req, res) => {
  const sessao = req.session as any;
  const filtro = PAPEIS_VISAO_GLOBAL.includes(sessao.papel) ? undefined : sessao.filialId;
  const notificacoes = await listarNotificacoes(filtro);
  res.json(notificacoes);
});

notificacoesRouter.get("/nao-lidas", async (req, res) => {
  const sessao = req.session as any;
  const filtro = PAPEIS_VISAO_GLOBAL.includes(sessao.papel) ? undefined : sessao.filialId;
  const total = await contarNaoLidas(filtro);
  res.json({ total });
});

notificacoesRouter.patch("/:id/lida", async (req, res) => {
  const notificacao = await marcarComoLida(req.params.id);
  res.json(notificacao);
});
