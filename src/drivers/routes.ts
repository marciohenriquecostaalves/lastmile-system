import { Router } from "express";
import { prisma } from "../orders/store";

export const driversRouter = Router();

driversRouter.post("/", async (req, res) => {
  const motorista = await prisma.driver.create({
    data: {
      nome: req.body.nome,
      telefone: req.body.telefone,
      veiculo: req.body.veiculo,
    },
  });
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
