import { prisma } from "../orders/store";
import { geocodificarComFallback } from "../geocoding/geocode";

export async function geocodificarPedidosPendentes(pedidos: any[]) {
  for (const pedido of pedidos) {
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

  const comCoordenadas = pedidos.filter((p) => p.latitude !== null && p.longitude !== null);
  const semLocalizacao = pedidos.filter((p) => p.latitude === null || p.longitude === null);

  return { comCoordenadas, semLocalizacao };
}
