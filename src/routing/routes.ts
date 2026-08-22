import { Router } from "express";
import { prisma } from "../orders/store";
import { geocodificarComFallback } from "../geocoding/geocode";
import { atualizarStatusPedido } from "../orders/store";
import { getHubCoords } from "./hub";
import { calcularDistanciaComFallback } from "./distancia";
import { exigirPapel } from "../auth/middleware";
import { criarNotificacao } from "../notificacoes/store";
import { geocodificarPedidosPendentes } from "./geocodificarPendentes";
import { sequenciarRota } from "./sequenciar";
import { clusterizarPedidos } from "./clusterizar";

export const routingRouter = Router();

const PAPEIS_ESCRITA = ["gerente", "supervisor", "coordenador", "dispatcher"];
const PAPEIS_VISAO_GLOBAL = ["gerente", "torre_controle"];

routingRouter.get("/hub", async (req, res) => {
  const hub = await getHubCoords();
  res.json(hub);
});

routingRouter.post("/gerar", exigirPapel(...PAPEIS_ESCRITA), async (req, res) => {
  const { driverId } = req.body;
  const sessao = req.session as any;
  const filialId = sessao.filialId;

  if (!filialId) {
    return res.status(400).json({ erro: "Seu usuario nao esta vinculado a uma filial." });
  }

  const pedidosPendentes = await prisma.order.findMany({
    where: { status: "recebido", filialId },
  });

  const { comCoordenadas, semLocalizacao } = await geocodificarPedidosPendentes(pedidosPendentes);
  const hub = await getHubCoords();
  const { paradas, distanciaTotal } = await sequenciarRota(comCoordenadas, hub);

  const rotaSalva = await prisma.route.create({
    data: {
      driverId: driverId ?? null,
      distanciaTotalKm: distanciaTotal,
      paradas: paradas,
      status: "planejada",
      filialId,
    },
  });

  if (paradas.length > 0) {
    await prisma.order.updateMany({
      where: { id: { in: paradas.map((p) => p.pedidoId) } },
      data: { status: "em_rota" },
    });

    await criarNotificacao({
      filialId,
      tipo: "rota_gerada",
      mensagem: `Rota gerada com ${paradas.length} parada(s), ${rotaSalva.distanciaTotalKm} km`,
    });
  }

  res.status(201).json({
    ...rotaSalva,
    pedidosNaoLocalizados: semLocalizacao.map((p) => ({
      pedidoId: p.id,
      codigoRastreio: p.codigoRastreio,
      endereco: p.enderecoEntrega,
    })),
  });
});

routingRouter.post("/gerar-multiplas", exigirPapel(...PAPEIS_ESCRITA), async (req, res) => {
  const { driverIds } = req.body as { driverIds: string[] };
  const sessao = req.session as any;
  const filialId = sessao.filialId;

  if (!filialId) {
    return res.status(400).json({ erro: "Seu usuario nao esta vinculado a uma filial." });
  }

  if (!Array.isArray(driverIds) || driverIds.length < 2) {
    return res.status(400).json({ erro: "Selecione pelo menos 2 motoristas para distribuir." });
  }

  const pedidosPendentes = await prisma.order.findMany({
    where: { status: "recebido", filialId },
  });

  const { comCoordenadas, semLocalizacao } = await geocodificarPedidosPendentes(pedidosPendentes);

  if (comCoordenadas.length === 0) {
    return res.status(400).json({
      erro: "Nenhum pedido pendente com localizacao valida para distribuir.",
      pedidosNaoLocalizados: semLocalizacao,
    });
  }

  const hub = await getHubCoords();
  const grupos = clusterizarPedidos(comCoordenadas, driverIds.length);

  const rotasCriadas = [];

  for (let i = 0; i < grupos.length; i++) {
    const grupo = grupos[i];
    if (grupo.length === 0) continue;

    const driverId = driverIds[i] ?? null;
    const { paradas, distanciaTotal } = await sequenciarRota(grupo, hub);

    const rotaSalva = await prisma.route.create({
      data: {
        driverId,
        distanciaTotalKm: distanciaTotal,
        paradas,
        status: "planejada",
        filialId,
      },
    });

    await prisma.order.updateMany({
      where: { id: { in: paradas.map((p) => p.pedidoId) } },
      data: { status: "em_rota" },
    });

    rotasCriadas.push(rotaSalva);
  }

  await criarNotificacao({
    filialId,
    tipo: "rota_gerada",
    mensagem: `${rotasCriadas.length} rota(s) geradas e distribuidas entre ${driverIds.length} motorista(s)`,
  });

  res.status(201).json({
    rotas: rotasCriadas,
    pedidosNaoLocalizados: semLocalizacao.map((p) => ({
      pedidoId: p.id,
      codigoRastreio: p.codigoRastreio,
      endereco: p.enderecoEntrega,
    })),
  });
});

routingRouter.get("/", async (req, res) => {
  const sessao = req.session as any;
  const filtroFilial = PAPEIS_VISAO_GLOBAL.includes(sessao.papel) ? undefined : sessao.filialId;
  const rotas = await prisma.route.findMany({
    where: filtroFilial ? { filialId: filtroFilial } : undefined,
    orderBy: { criadoEm: "desc" },
  });
  res.json(rotas);
});

routingRouter.get("/:id", async (req, res) => {
  const rota = await prisma.route.findUnique({ where: { id: req.params.id } });
  if (!rota) return res.status(404).json({ erro: "Rota não encontrada" });
  res.json(rota);
});

routingRouter.patch("/:id/iniciar", exigirPapel(...PAPEIS_ESCRITA), async (req, res) => {
  const rota = await prisma.route.update({
    where: { id: req.params.id },
    data: { status: "em_andamento" },
  });
  res.json(rota);
});

routingRouter.patch("/:id/paradas/:pedidoId/entregar", exigirPapel(...PAPEIS_ESCRITA), async (req, res) => {
  const { tipo, url } = req.body;

  const pedidoAtualizado = await atualizarStatusPedido(
    req.params.pedidoId,
    "entregue",
    { tipo, url }
  );
  if (!pedidoAtualizado)
    return res.status(404).json({ erro: "Pedido não encontrado" });

  const rota = await prisma.route.findUnique({ where: { id: req.params.id } });
  if (!rota) return res.status(404).json({ erro: "Rota não encontrada" });

  const paradas = rota.paradas as any[];
  const idsPedidos = paradas.map((p) => p.pedidoId);
  const pedidosDaRota = await prisma.order.findMany({
    where: { id: { in: idsPedidos } },
  });
  const todosEntregues = pedidosDaRota.every((p) => p.status === "entregue");

  if (todosEntregues) {
    await prisma.route.update({
      where: { id: req.params.id },
      data: { status: "concluida" },
    });

    await criarNotificacao({
      filialId: rota.filialId,
      tipo: "rota_concluida",
      mensagem: `Rota com ${paradas.length} parada(s) foi concluida`,
    });
  }

  res.json({ pedido: pedidoAtualizado, rotaConcluida: todosEntregues });
});
