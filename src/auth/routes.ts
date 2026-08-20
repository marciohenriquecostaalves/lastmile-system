import { Router } from "express";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === process.env.ADMIN_USER && senha === process.env.ADMIN_PASSWORD) {
    (req.session as any).autenticado = true;
    return res.json({ ok: true });
  }

  res.status(401).json({ erro: "Usuario ou senha invalidos" });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

authRouter.get("/status", (req, res) => {
  res.json({ autenticado: !!(req.session as any)?.autenticado });
});
