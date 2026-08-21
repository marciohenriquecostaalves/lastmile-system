import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../orders/store";
import { criarUsuarioSchema } from "./validation";

export const usuariosRouter = Router();

const PAPEIS_QUE_SUPERVISOR_PODE_CRIAR = ["coordenador", "dispatcher"];

usuariosRouter.post("/", async (req, res) => {
  const sessao = req.session as any;

  if (sessao.papel !== "gerente" && sessao.papel !== "supervisor") {
    return res.status(403).json({ erro: "Voce nao tem permissao para criar usuarios" });
  }

  const validacao = criarUsuarioSchema.safeParse(req.body);
  if (!validacao.success) {
    return res.status(400).json({
      erro: "Dados invalidos",
      detalhes: validacao.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensagem: i.message,
      })),
    });
  }

  const dados = validacao.data;

  if (sessao.papel === "supervisor") {
    if (!PAPEIS_QUE_SUPERVISOR_PODE_CRIAR.includes(dados.papel)) {
      return res.status(403).json({
        erro: "Supervisor so pode criar coordenador ou dispatcher",
      });
    }
    dados.filialId = sessao.filialId;
  }

  const emailExistente = await prisma.usuario.findUnique({ where: { email: dados.email } });
  if (emailExistente) {
    return res.status(400).json({ erro: "Ja existe um usuario com este email" });
  }

  const senhaHash = await bcrypt.hash(dados.senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome: dados.nome,
      email: dados.email,
      senhaHash,
      papel: dados.papel,
      filialId: dados.filialId || null,
    },
  });

  res.status(201).json({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    filialId: usuario.filialId,
  });
});

usuariosRouter.get("/", async (req, res) => {
  const sessao = req.session as any;

  if (sessao.papel !== "gerente" && sessao.papel !== "supervisor") {
    return res.status(403).json({ erro: "Voce nao tem permissao para ver usuarios" });
  }

  const filtro = sessao.papel === "gerente" ? undefined : { filialId: sessao.filialId };

  const usuarios = await prisma.usuario.findMany({
    where: filtro,
    select: { id: true, nome: true, email: true, papel: true, filialId: true, criadoEm: true },
    orderBy: { criadoEm: "desc" },
  });

  res.json(usuarios);
});
