import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../orders/store";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return res.status(401).json({ erro: "Email ou senha invalidos" });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaCorreta) {
    return res.status(401).json({ erro: "Email ou senha invalidos" });
  }

  (req.session as any).usuarioId = usuario.id;
  (req.session as any).papel = usuario.papel;
  (req.session as any).filialId = usuario.filialId;

  res.json({
    ok: true,
    usuario: { nome: usuario.nome, papel: usuario.papel, filialId: usuario.filialId },
  });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

authRouter.get("/status", (req, res) => {
  const sessao = req.session as any;
  if (!sessao?.usuarioId) return res.json({ autenticado: false });
  res.json({
    autenticado: true,
    papel: sessao.papel,
    filialId: sessao.filialId,
  });
});
