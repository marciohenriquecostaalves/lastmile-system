import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function criarPedido(dados: {
  codigoRastreio: string;
  destinatarioNome: string;
  destinatarioTelefone: string;
  enderecoColeta: string;
  enderecoEntrega: string;
  janelaEntrega: string;
  filialId: string;
}) {
  return prisma.order.create({ data: dados });
}

export async function listarPedidos(filialId?: string) {
  return prisma.order.findMany({
    where: filialId ? { filialId } : undefined,
    orderBy: { criadoEm: "desc" },
  });
}

export async function buscarPedido(id: string) {
  return prisma.order.findUnique({ where: { id } });
}

export async function atualizarStatusPedido(
  id: string,
  status: string,
  comprovante?: { tipo: string; url: string }
) {
  return prisma.order.update({
    where: { id },
    data: {
      status,
      comprovanteTipo: comprovante?.tipo,
      comprovanteUrl: comprovante?.url,
      comprovanteData: comprovante ? new Date() : undefined,
    },
  });
}

export async function editarPedido(
  id: string,
  dados: {
    destinatarioNome: string;
    destinatarioTelefone: string;
    enderecoColeta: string;
    enderecoEntrega: string;
    janelaEntrega: string;
  }
) {
  return prisma.order.update({
    where: { id },
    data: {
      ...dados,
      latitude: null,
      longitude: null,
      localizacaoAproximada: false,
    },
  });
}

export async function cancelarPedido(id: string) {
  return prisma.order.update({
    where: { id },
    data: { status: "cancelado" },
  });
}
