import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const filial = await prisma.filial.findFirst({ where: { nome: "Filial Padrao" } });
  if (!filial) {
    console.error("Filial padrao nao encontrada. Rode o seed primeiro.");
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash("mude-esta-senha", 10);

  const dispatcher = await prisma.usuario.create({
    data: {
      nome: "Dispatcher Padrao",
      email: "dispatcher@lastmile.com",
      senhaHash,
      papel: "dispatcher",
      filialId: filial.id,
    },
  });

  console.log("Usuario criado:", dispatcher.email, "- filial:", filial.nome);
}

main().finally(() => prisma.$disconnect());
