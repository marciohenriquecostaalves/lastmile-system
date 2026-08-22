import { prisma } from "../orders/store";

export async function criarNotificacao(dados: {
  filialId?: string | null;
  tipo: string;
  mensagem: string;
}) {
  return prisma.notificacao.create({ data: dados });
}

export async function listarNotificacoes(filialId?: string) {
  return prisma.notificacao.findMany({
    where: filialId ? { OR: [{ filialId }, { filialId: null }] } : undefined,
    orderBy: { criadoEm: "desc" },
    take: 30,
  });
}

export async function marcarComoLida(id: string) {
  return prisma.notificacao.update({
    where: { id },
    data: { lida: true },
  });
}

export async function contarNaoLidas(filialId?: string) {
  return prisma.notificacao.count({
    where: {
      lida: false,
      ...(filialId ? { OR: [{ filialId }, { filialId: null }] } : {}),
    },
  });
}
