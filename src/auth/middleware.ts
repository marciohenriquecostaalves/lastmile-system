import { Request, Response, NextFunction } from "express";

export function exigirAutenticacaoApi(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.usuarioId) return next();
  res.status(401).json({ erro: "Nao autenticado" });
}

export function exigirAutenticacaoPagina(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.usuarioId) return next();
  res.redirect("/login.html");
}

export function exigirPapel(...papeisPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const papel = (req.session as any)?.papel;
    if (papel && papeisPermitidos.includes(papel)) return next();
    res.status(403).json({ erro: "Voce nao tem permissao para esta acao" });
  };
}
