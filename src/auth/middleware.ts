import { Request, Response, NextFunction } from "express";

export function exigirAutenticacaoApi(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.autenticado) return next();
  res.status(401).json({ erro: "Nao autenticado" });
}

export function exigirAutenticacaoPagina(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.autenticado) return next();
  res.redirect("/login.html");
}
