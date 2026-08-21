import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const filial = await prisma.filial.create({
    data: {
      nome: "Filial Padrao",
      cidade: "Biguacu/SC",
    },
  });

  const senhaHash = await bcrypt.hash("mude-esta-senha", 10);

  const gerente = await prisma.usuario.create({
    data: {
      nome: "Gerente Geral",
      email: "gerente@lastmile.com",
      senhaHash,
      papel: "gerente",
      filialId: null,
    },
  });

  console.log("Filial criada:", filial.nome, filial.id);
  console.log("Usuario criado:", gerente.email, "- senha inicial: mude-esta-senha");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
