import { Router } from "express";
import { prisma } from "../orders/store";
import { geocodificarComFallback } from "../geocoding/geocode";
import { getHubCoords } from "./hub";
import { calcularDistanciaKm } from "./haversine";

export const routingRouter = Router();

routingRouter.post("/gerar", async (req, res) => {
  const pedidosPendentes = await prisma.order.findMany({
    where: { status: "recebido" },
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
  const rota: any[] = [];
  let pontoAtual = hub;
  let distanciaTotal = 0;

  while (restantes.length > 0) {
    let indiceMaisProximo = 0;
    let menorDistancia = Infinity;

    restantes.forEach((pedido, index) => {
      const distancia = calcularDistanciaKm(pontoAtual, {
        latitude: pedido.latitude as number,
        longitude: pedido.longitude as number,
      });
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        indiceMaisProximo = index;
      }
    });

    const proximoPedido = restantes.splice(indiceMaisProximo, 1)[0];
    distanciaTotal += menorDistancia;

    rota.push({
      sequencia: rota.length + 1,
      pedidoId: proximoPedido.id,
      codigoRastreio: proximoPedido.codigoRastreio,
      endereco: proximoPedido.enderecoEntrega,
      distanciaDoPontoAnteriorKm: Number(menorDistancia.toFixed(2)),
      localizacaoAproximada: proximoPedido.localizacaoAproximada,
    });

    pontoAtual = {
      latitude: proximoPedido.latitude as number,
      longitude: proximoPedido.longitude as number,
    };
  }

  res.json({
    totalParadas: rota.length,
    distanciaTotalKm: Number(distanciaTotal.toFixed(2)),
    paradas: rota,
    pedidosNaoLocalizados: pedidosSemLocalizacao.map((p) => ({
      pedidoId: p.id,
      codigoRastreio: p.codigoRastreio,
      endereco: p.enderecoEntrega,
    })),
  });
});
