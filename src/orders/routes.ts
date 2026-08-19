import { Router } from "express";
import { randomUUID } from "crypto";
import {
  criarPedido,
  listarPedidos,
  buscarPedido,
  atualizarStatusPedido,
} from "./store";

export const ordersRouter = Router();

function paraFormatoApi(pedido: any) {
  return {
    id: pedido.id,
    codigoRastreio: pedido.codigoRastreio,
    destinatario: {
      nome: pedido.destinatarioNome,
      telefone: pedido.destinatarioTelefone,
    },
    enderecoColeta: pedido.enderecoColeta,
    enderecoEntrega: pedido.enderecoEntrega,
    janelaEntrega: pedido.janelaEntrega,
    status: pedido.status,
    comprovante: pedido.comprovanteTipo
      ? {
          tipo: pedido.comprovanteTipo,
          url: pedido.comprovanteUrl,
          dataHora: pedido.comprovanteData,
        }
      : undefined,
    criadoEm: pedido.criadoEm,
  };
}

ordersRouter.post("/", async (req, res) => {
  const novoPedido = await criarPedido({
    codigoRastreio: "LM-" + randomUUID().slice(0, 8).toUpperCase(),
    destinatarioNome: req.body.destinatario.nome,
    destinatarioTelefone: req.body.destinatario.telefone,
    enderecoColeta: req.body.enderecoColeta,
    enderecoEntrega: req.body.enderecoEntrega,
    janelaEntrega: req.body.janelaEntrega,
  });
  res.status(201).json(paraFormatoApi(novoPedido));
});

ordersRouter.get("/", async (req, res) => {
  const pedidos = await listarPedidos();
  res.json(pedidos.map(paraFormatoApi));
});

ordersRouter.get("/:id", async (req, res) => {
  const pedido = await buscarPedido(req.params.id);
  if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado" });
  res.json(paraFormatoApi(pedido));
});

ordersRouter.patch("/:id/entregar", async (req, res) => {
  const { tipo, url } = req.body;
  const pedidoAtualizado = await atualizarStatusPedido(req.params.id, "entregue", {
    tipo,
    url,
  });
  res.json(paraFormatoApi(pedidoAtualizado));
});
