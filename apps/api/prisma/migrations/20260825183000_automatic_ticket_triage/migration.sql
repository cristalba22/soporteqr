-- CreateEnum
CREATE TYPE "TicketImpact" AS ENUM ('PERSONA', 'SECTOR', 'ORGANIZACION');

-- AlterTable
ALTER TABLE "tickets"
ADD COLUMN "prioridadCalculada" "TicketPriority" NOT NULL DEFAULT 'MEDIA',
ADD COLUMN "prioridadMotivo" TEXT,
ADD COLUMN "triageVersion" TEXT NOT NULL DEFAULT 'rules-v1',
ADD COLUMN "impacto" "TicketImpact" NOT NULL DEFAULT 'PERSONA',
ADD COLUMN "servicioInterrumpido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tieneAlternativa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "riesgoSeguridad" BOOLEAN NOT NULL DEFAULT false;
