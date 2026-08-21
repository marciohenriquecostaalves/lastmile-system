import { Router } from "express";
import { randomUUID } from "crypto";
import {
  criarPedido,
  listarPedidos,
  buscarPedido,
  atualizarStatusPedido,
  editarPedido,
  cancelarPedido,
} from "./store";
import { criarPedidoSchema, editarPedidoSchema } from "./validation";
import { exigirPapel } from "../auth/middleware";

export const ordersRouter = Router();

const PAPEIS_ESCRITA = ["gerente", "supervisor", "coordenador", "dispatcher"];
const PAPEIS_VISAO_GLOBAL = ["gerente", "torre_controle"];

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
    filialId: pedido.filialId,
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

ordersRouter.post("/", exigirPapel(...PAPEIS_ESCRITA), async (req, res) => {
  const validacao = criarPedidoSchema.safeParse(req.body);
  if (!validacao.success) {
    return res.status(400).json({
      erro: "Dados invalidos",
      detalhes: validacao.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensagem: i.message,
      })),
    });
  }

  const filialId = (req.session as any).filialId;
  if (!filialId) {
    return res.status(400).json({
      erro: "Seu usuario nao esta vinculado a uma filial. Peca ao gerente para configurar.",
    });
  }

  const dados = validacao.data;

  const novoPedido = await criarPedido({
    codigoRastreio: "LM-" + randomUUID().slice(0, 8).toUpperCase(),
    destinatarioNome: dados.destinatario.nome,
    destinatarioTelefone: dados.destinatario.telefone,
    enderecoColeta: dados.enderecoColeta,
    enderecoEntrega: dados.enderecoEntrega,
    janelaEntrega: dados.janelaEntrega,
    filialId,
  });
  res.status(201).json(paraFormatoApi(novoPedido));
});

ordersRouter.get("/", async (req, res) => {
  const sessao = req.session as any;
  const filtroFilial = PAPEIS_VISAO_GLOBAL.includes(sessao.papel) ? undefined : sessao.filialId;
  const pedidos = await listarPedidos(filtroFilial);
  res.json(pedidos.map(paraFormatoApi));
});

ordersRouter.get("/:id", async (req, res) => {
  const pedido = await buscarPedido(req.params.id);
  if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado" });
  res.json(paraFormatoApi(pedido));
});

ordersRouter.put("/:id", exigirPapel(...PAPEIS_ESCRITA), async (req, res) => {
  const pedido = await buscarPedido(req.params.id);
  if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado" });

  if (pedido.status !== "recebido") {
    return res.status(400).json({
      erro: "So e possivel editar pedidos que ainda nao entraram em rota.",
    });
  }

  const validacao = editarPedidoSchema.safeParse(req.body);
  if (!validacao.success) {
    return res.status(400).json({
      erro: "Dados invalidos",
      detalhes: validacao.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensagem: i.message,
      })),
    });
  }

  const dados = validacao.data;
  const pedidoAtualizado = await editarPedido(req.params.id, {
    destinatarioNome: dados.destinatario.nome,
    destinatarioTelefone: dados.destinatario.telefone,
    enderecoColeta: dados.enderecoColeta,
    enderecoEntrega: dados.enderecoEntrega,
    janelaEntrega: dados.janelaEntrega,
  });

  res.json(paraFormatoApi(pedidoAtualizado));
});

ordersRouter.patch("/:id/cancelar", exigirPapel(...PAPEIS_ESCRITA), async (req, res) => {
  const pedido = await buscarPedido(req.params.id);
  if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado" });

  if (pedido.status !== "recebido") {
    return res.status(400).json({
      erro: "So e possivel cancelar pedidos que ainda nao entraram em rota.",
    });
  }

  const pedidoCancelado = await cancelarPedido(req.params.id);
  res.json(paraFormatoApi(pedidoCancelado));
});

ordersRouter.patch("/:id/entregar", exigirPapel(...PAPEIS_ESCRITA), async (req, res) => {
  const { tipo, url } = req.body;
  const pedidoAtualizado = await atualizarStatusPedido(req.params.id, "entregue", {
    tipo,
    url,
  });
  res.json(paraFormatoApi(pedidoAtualizado));
});
