-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "codigoRastreio" TEXT NOT NULL,
    "destinatarioNome" TEXT NOT NULL,
    "destinatarioTelefone" TEXT NOT NULL,
    "enderecoColeta" TEXT NOT NULL,
    "enderecoEntrega" TEXT NOT NULL,
    "janelaEntrega" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recebido',
    "comprovanteTipo" TEXT,
    "comprovanteUrl" TEXT,
    "comprovanteData" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_codigoRastreio_key" ON "Order"("codigoRastreio");
