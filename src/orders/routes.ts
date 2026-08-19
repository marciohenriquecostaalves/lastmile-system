import { Router } from "express";
import { randomUUID } from "crypto";
import { criarPedido, listarPedidos, buscarPedido } from "./store";
import { Order } from "./types";

export const ordersRouter = Router();

ordersRouter.post("/", (req, res) => {
  const novoPedido: Order = {
    id: randomUUID(),
    destinatario: req.body.destinatario,
    enderecoColeta: req.body.enderecoColeta,
    enderecoEntrega: req.body.enderecoEntrega,
    janelaEntrega: req.body.janelaEntrega,
    status: "recebido",
    criadoEm: new Date().toISOString(),
  };
  criarPedido(novoPedido);
  res.status(201).json(novoPedido);
});

ordersRouter.get("/", (req, res) => {
  res.json(listarPedidos());
});

ordersRouter.get("/:id", (req, res) => {
  const pedido = buscarPedido(req.params.id);
  if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado" });
  res.json(pedido);
});