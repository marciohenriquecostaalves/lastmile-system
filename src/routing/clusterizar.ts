interface Ponto {
  latitude: number;
  longitude: number;
}

function distanciaEntrePontos(a: Ponto, b: Ponto): number {
  return Math.sqrt((a.latitude - b.latitude) ** 2 + (a.longitude - b.longitude) ** 2);
}

export function clusterizarPedidos(pedidos: any[], quantidadeGrupos: number): any[][] {
  const n = pedidos.length;

  if (quantidadeGrupos <= 1 || n <= quantidadeGrupos) {
    return pedidos.map((p) => [p]);
  }

  const indicesIniciais = Array.from({ length: quantidadeGrupos }, (_, i) =>
    Math.floor((i * n) / quantidadeGrupos)
  );
  let centroides: Ponto[] = indicesIniciais.map((i) => ({
    latitude: pedidos[i].latitude,
    longitude: pedidos[i].longitude,
  }));

  let atribuicoes = new Array(n).fill(0);

  for (let iteracao = 0; iteracao < 15; iteracao++) {
    for (let i = 0; i < n; i++) {
      let menorDistancia = Infinity;
      let melhorGrupo = 0;
      for (let g = 0; g < quantidadeGrupos; g++) {
        const distancia = distanciaEntrePontos(pedidos[i], centroides[g]);
        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          melhorGrupo = g;
        }
      }
      atribuicoes[i] = melhorGrupo;
    }

    const somas = Array.from({ length: quantidadeGrupos }, () => ({
      lat: 0,
      lon: 0,
      total: 0,
    }));

    for (let i = 0; i < n; i++) {
      const g = atribuicoes[i];
      somas[g].lat += pedidos[i].latitude;
      somas[g].lon += pedidos[i].longitude;
      somas[g].total++;
    }

    centroides = somas.map((soma, indice) =>
      soma.total > 0
        ? { latitude: soma.lat / soma.total, longitude: soma.lon / soma.total }
        : centroides[indice]
    );
  }

  const grupos: any[][] = Array.from({ length: quantidadeGrupos }, () => []);
  for (let i = 0; i < n; i++) {
    grupos[atribuicoes[i]].push(pedidos[i]);
  }

  return grupos.filter((g) => g.length > 0);
}
