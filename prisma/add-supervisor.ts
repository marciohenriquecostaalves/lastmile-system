import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const filial = await prisma.filial.findFirst({ where: { nome: "Filial Padrao" } });
  if (!filial) {
    console.error("Filial padrao nao encontrada.");
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash("mude-esta-senha", 10);

  const supervisor = await prisma.usuario.create({
    data: {
      nome: "Supervisor Padrao",
      email: "supervisor@lastmile.com",
      senhaHash,
      papel: "supervisor",
      filialId: filial.id,
    },
  });

  const torreControle = await prisma.usuario.create({
    data: {
      nome: "Torre de Controle",
      email: "torre@lastmile.com",
      senhaHash,
      papel: "torre_controle",
      filialId: null,
    },
  });

  console.log("Criado:", supervisor.email, "- papel: supervisor");
  console.log("Criado:", torreControle.email, "- papel: torre_controle");
}

main().finally(() => prisma.$disconnect());
