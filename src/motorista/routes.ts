import { Router } from "express";
import { prisma, atualizarStatusPedido } from "../orders/store";

export const motoristaRouter = Router();

async function enriquecerParadas(paradas: any[]) {
  const idsPedidos = paradas.map((p) => p.pedidoId);
  const pedidos = await prisma.order.findMany({
    where: { id: { in: idsPedidos } },
  });
  const mapaPedidos = new Map(pedidos.map((p) => [p.id, p]));

  return paradas.map((p) => {
    const pedido = mapaPedidos.get(p.pedidoId);
    return {
      ...p,
      destinatarioNome: pedido?.destinatarioNome,
      status: pedido?.status,
    };
  });
}

motoristaRouter.get("/:driverId/rotas", async (req, res) => {
  const motorista = await prisma.driver.findUnique({
    where: { id: req.params.driverId },
  });
  if (!motorista) return res.status(404).json({ erro: "Motorista nao encontrado" });

  const rotas = await prisma.route.findMany({
    where: {
      driverId: req.params.driverId,
      status: { in: ["planejada", "em_andamento"] },
    },
    orderBy: { criadoEm: "asc" },
  });

  const rotasComParadasEnriquecidas = await Promise.all(
    rotas.map(async (rota) => ({
      ...rota,
      paradas: await enriquecerParadas(rota.paradas as any[]),
    }))
  );

  res.json({ motorista, rotas: rotasComParadasEnriquecidas });
});

motoristaRouter.patch("/:driverId/rotas/:rotaId/iniciar", async (req, res) => {
  const rota = await prisma.route.update({
    where: { id: req.params.rotaId },
    data: { status: "em_andamento" },
  });
  res.json(rota);
});

motoristaRouter.patch(
  "/:driverId/rotas/:rotaId/paradas/:pedidoId/entregar",
  async (req, res) => {
    const { tipo, url } = req.body;

    const pedidoAtualizado = await atualizarStatusPedido(
      req.params.pedidoId,
      "entregue",
      { tipo, url }
    );
    if (!pedidoAtualizado)
      return res.status(404).json({ erro: "Pedido nao encontrado" });

    const rota = await prisma.route.findUnique({
      where: { id: req.params.rotaId },
    });
    if (!rota) return res.status(404).json({ erro: "Rota nao encontrada" });

    const paradas = rota.paradas as any[];
    const idsPedidos = paradas.map((p) => p.pedidoId);
    const pedidosDaRota = await prisma.order.findMany({
      where: { id: { in: idsPedidos } },
    });
    const todosEntregues = pedidosDaRota.every((p) => p.status === "entregue");

    if (todosEntregues) {
      await prisma.route.update({
        where: { id: req.params.rotaId },
        data: { status: "concluida" },
      });
    }

    res.json({ pedido: pedidoAtualizado, rotaConcluida: todosEntregues });
  }
);
