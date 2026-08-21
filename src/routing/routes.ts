import { Router } from "express";
import { prisma } from "../orders/store";
import { geocodificarComFallback } from "../geocoding/geocode";
import { atualizarStatusPedido } from "../orders/store";
import { getHubCoords } from "./hub";
import { calcularDistanciaComFallback } from "./distancia";
import { exigirPapel } from "../auth/middleware";

export const routingRouter = Router();

const PAPEIS_ESCRITA = ["gerente", "supervisor", "coordenador", "dispatcher"];
const PAPEIS_VISAO_GLOBAL = ["gerente", "torre_controle"];

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

  for (const pedido of pedidosPendentes) {
    if (pedido.latitude === null || pedido.longitude === null) {
      const resultado = await geocodificarComFallback(pedido.enderecoEntrega);
      if (resultado) {
        await prisma.order.update({
          where: { id: pedido.id },
          data: {
            latitude: resultado.latitude,
            longitude: resultado.longitude,
            localizacaoAproximada: resultado.aproximado,
          },
        });
        pedido.latitude = resultado.latitude;
        pedido.longitude = resultado.longitude;
        pedido.localizacaoAproximada = resultado.aproximado;
      }
    }
  }

  const pedidosComCoordenadas = pedidosPendentes.filter(
    (p) => p.latitude !== null && p.longitude !== null
  );
  const pedidosSemLocalizacao = pedidosPendentes.filter(
    (p) => p.latitude === null || p.longitude === null
  );

  const hub = await getHubCoords();

  const restantes = [...pedidosComCoordenadas];
  const paradas: any[] = [];
  let pontoAtual = hub;
  let distanciaTotal = 0;

  while (restantes.length > 0) {
    let indiceMaisProximo = 0;
    let menorDistancia = Infinity;
    let distanciaEraReal = false;

    for (let index = 0; index < restantes.length; index++) {
      const pedido = restantes[index];
      const resultado = await calcularDistanciaComFallback(pontoAtual, {
        latitude: pedido.latitude as number,
        longitude: pedido.longitude as number,
      });
      if (resultado.km < menorDistancia) {
        menorDistancia = resultado.km;
        indiceMaisProximo = index;
        distanciaEraReal = resultado.real;
      }
    }

    const proximoPedido = restantes.splice(indiceMaisProximo, 1)[0];
    distanciaTotal += menorDistancia;

    paradas.push({
      sequencia: paradas.length + 1,
      pedidoId: proximoPedido.id,
      codigoRastreio: proximoPedido.codigoRastreio,
      endereco: proximoPedido.enderecoEntrega,
      distanciaDoPontoAnteriorKm: Number(menorDistancia.toFixed(2)),
      distanciaCalculadaPorRua: distanciaEraReal,
      localizacaoAproximada: proximoPedido.localizacaoAproximada,
    });

    pontoAtual = {
      latitude: proximoPedido.latitude as number,
      longitude: proximoPedido.longitude as number,
    };
  }

  const rotaSalva = await prisma.route.create({
    data: {
      driverId: driverId ?? null,
      distanciaTotalKm: Number(distanciaTotal.toFixed(2)),
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
  }

  res.status(201).json({
    ...rotaSalva,
    pedidosNaoLocalizados: pedidosSemLocalizacao.map((p) => ({
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
  }

  res.json({ pedido: pedidoAtualizado, rotaConcluida: todosEntregues });
});
