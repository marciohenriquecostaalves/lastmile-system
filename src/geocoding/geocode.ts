export async function geocodificarEndereco(
  endereco: string
): Promise<{ latitude: number; longitude: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    endereco
  )}`;

  const resposta = await fetch(url, {
    headers: {
      "User-Agent": "lastmile-system/1.0 (projeto em desenvolvimento)",
    },
  });

  const dados = await resposta.json();
  if (!dados || dados.length === 0) return null;

  return {
    latitude: parseFloat(dados[0].lat),
    longitude: parseFloat(dados[0].lon),
  };
}

export async function geocodificarComFallback(
  endereco: string
): Promise<{ latitude: number; longitude: number; aproximado: boolean } | null> {
  const resultadoExato = await geocodificarEndereco(endereco);
  if (resultadoExato) {
    return { ...resultadoExato, aproximado: false };
  }

  const partes = endereco.split(",").map((p) => p.trim());
  const cidadeEstado = partes.slice(-2).join(", ");

  if (cidadeEstado && cidadeEstado !== endereco) {
    const resultadoAproximado = await geocodificarEndereco(cidadeEstado);
    if (resultadoAproximado) {
      return { ...resultadoAproximado, aproximado: true };
    }
  }

  return null;
}
