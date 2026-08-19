import { Router } from "express";
import { prisma } from "../orders/store";
import { criarMotoristaSchema } from "./validation";

export const driversRouter = Router();

driversRouter.post("/", async (req, res) => {
  const validacao = criarMotoristaSchema.safeParse(req.body);

  if (!validacao.success) {
    return res.status(400).json({
      erro: "Dados invalidos",
      detalhes: validacao.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensagem: i.message,
      })),
    });
  }

  const motorista = await prisma.driver.create({ data: validacao.data });
  res.status(201).json(motorista);
});

driversRouter.get("/", async (req, res) => {
  const motoristas = await prisma.driver.findMany();
  res.json(motoristas);
});

driversRouter.get("/:id", async (req, res) => {
  const motorista = await prisma.driver.findUnique({
    where: { id: req.params.id },
  });
  if (!motorista) return res.status(404).json({ erro: "Motorista não encontrado" });
  res.json(motorista);
});

driversRouter.get("/:id/rotas", async (req, res) => {
  const rotas = await prisma.route.findMany({
    where: { driverId: req.params.id },
    orderBy: { criadoEm: "desc" },
  });
  res.json(rotas);
});
