import { z } from "zod";

export const criarPedidoSchema = z.object({
  destinatario: z.object({
    nome: z.string().min(1, "Nome do destinatario e obrigatorio"),
    telefone: z.string().min(8, "Telefone invalido"),
  }),
  enderecoColeta: z.string().min(5, "Endereco de coleta e obrigatorio"),
  enderecoEntrega: z.string().min(5, "Endereco de entrega e obrigatorio"),
  janelaEntrega: z.string().min(1, "Janela de entrega e obrigatoria"),
});
