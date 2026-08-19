import { z } from "zod";

export const criarMotoristaSchema = z.object({
  nome: z.string().min(1, "Nome e obrigatorio"),
  telefone: z.string().min(8, "Telefone invalido"),
  veiculo: z.string().optional(),
});
