import { Router } from "express";
import { prisma } from "../orders/store";

export const rastreioRouter = Router();

const ETAPAS = ["recebido", "em_rota", "entregue"];

rastreioRouter.get("/:codigo", async (req, res) => {
  const pedido = await prisma.order.findUnique({
    where: { codigoRastreio: req.params.codigo.toUpperCase() },
  });

  if (!pedido) {
    return res.status(404).json({ erro: "Codigo de rastreio nao encontrado" });
  }

  let motoristaNome: string | null = null;
  if (pedido.status === "em_rota") {
    const rota = await prisma.route.findFirst({
      where: {
        status: { in: ["planejada", "em_andamento"] },
        paradas: { array_contains: [{ pedidoId: pedido.id }] },
      },
    });
    if (rota?.driverId) {
      const motorista = await prisma.driver.findUnique({ where: { id: rota.driverId } });
      motoristaNome = motorista?.nome ?? null;
    }
  }

  res.json({
    codigoRastreio: pedido.codigoRastreio,
    status: pedido.status,
    etapaAtual: pedido.status === "cancelado" ? null : ETAPAS.indexOf(pedido.status),
    destinatario: pedido.destinatarioNome,
    cidadeAproximada: pedido.enderecoEntrega.split(",").slice(-2).join(",").trim(),
    janelaEntrega: pedido.janelaEntrega,
    motoristaNome,
    entregueEm: pedido.comprovanteData,
    criadoEm: pedido.criadoEm,
  });
});
