import { calcularDistanciaComFallback } from "./distancia";

export async function sequenciarRota(
  pedidos: any[],
  hub: { latitude: number; longitude: number }
) {
  const restantes = [...pedidos];
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
        latitude: pedido.latitude,
        longitude: pedido.longitude,
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
      latitude: proximoPedido.latitude,
      longitude: proximoPedido.longitude,
      distanciaDoPontoAnteriorKm: Number(menorDistancia.toFixed(2)),
      distanciaCalculadaPorRua: distanciaEraReal,
      localizacaoAproximada: proximoPedido.localizacaoAproximada,
    });

    pontoAtual = {
      latitude: proximoPedido.latitude,
      longitude: proximoPedido.longitude,
    };
  }

  return { paradas, distanciaTotal: Number(distanciaTotal.toFixed(2)) };
}
