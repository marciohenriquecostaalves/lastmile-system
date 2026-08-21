export async function calcularDistanciaRodoviariaKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.longitude},${a.latitude};${b.longitude},${b.latitude}?overview=false`;
    const resposta = await fetch(url);
    const dados = await resposta.json();

    if (dados.code !== "Ok" || !dados.routes || dados.routes.length === 0) {
      return null;
    }

    return dados.routes[0].distance / 1000;
  } catch {
    return null;
  }
}
