import { z } from "zod";

export const criarUsuarioSchema = z.object({
  nome: z.string().min(1, "Nome e obrigatorio"),
  email: z.string().email("Email invalido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  papel: z.enum(["gerente", "supervisor", "coordenador", "torre_controle", "dispatcher"]),
  filialId: z.string().optional(),
});
