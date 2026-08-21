import { Router } from "express";
import { prisma } from "../orders/store";
import { exigirPapel } from "../auth/middleware";

export const filiaisRouter = Router();

filiaisRouter.post("/", exigirPapel("gerente"), async (req, res) => {
  const { nome, cidade } = req.body;
  if (!nome) return res.status(400).json({ erro: "Nome da filial e obrigatorio" });

  const filial = await prisma.filial.create({ data: { nome, cidade } });
  res.status(201).json(filial);
});

filiaisRouter.get("/", async (req, res) => {
  const filiais = await prisma.filial.findMany({ orderBy: { nome: "asc" } });
  res.json(filiais);
});

filiaisRouter.get("/:id", async (req, res) => {
  const filial = await prisma.filial.findUnique({ where: { id: req.params.id } });
  if (!filial) return res.status(404).json({ erro: "Filial nao encontrada" });
  res.json(filial);
});

filiaisRouter.get("/:id/resumo", exigirPapel("gerente", "torre_controle"), async (req, res) => {
  const filialId = req.params.id;

  const [totalPedidos, pedidosEntregues, totalMotoristas, rotasAtivas] = await Promise.all([
    prisma.order.count({ where: { filialId } }),
    prisma.order.count({ where: { filialId, status: "entregue" } }),
    prisma.driver.count({ where: { filialId } }),
    prisma.route.count({ where: { filialId, status: { in: ["planejada", "em_andamento"] } } }),
  ]);

  res.json({ filialId, totalPedidos, pedidosEntregues, totalMotoristas, rotasAtivas });
});
