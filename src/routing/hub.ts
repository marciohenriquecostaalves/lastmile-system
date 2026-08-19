import { geocodificarEndereco } from "../geocoding/geocode";

const ENDERECO_HUB = "Rua Jose Zimmermann, 112, Mar das Pedras, Biguacu, SC";

let hubCoords: { latitude: number; longitude: number } | null = null;

export async function getHubCoords() {
  if (hubCoords) return hubCoords;
  const resultado = await geocodificarEndereco(ENDERECO_HUB);
  if (!resultado) {
    throw new Error("Nao foi possivel localizar o endereco do hub");
  }
  hubCoords = resultado;
  return hubCoords;
}
