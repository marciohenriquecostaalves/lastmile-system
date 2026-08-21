import { calcularDistanciaRodoviariaKm } from "./osrm";
import { calcularDistanciaKm as calcularDistanciaLinhaReta } from "./haversine";

export async function calcularDistanciaComFallback(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): Promise<{ km: number; real: boolean }> {
  const distanciaReal = await calcularDistanciaRodoviariaKm(a, b);
  if (distanciaReal !== null) {
    return { km: distanciaReal, real: true };
  }
  return { km: calcularDistanciaLinhaReta(a, b), real: false };
}
