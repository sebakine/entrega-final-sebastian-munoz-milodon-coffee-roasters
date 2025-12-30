-- AlterTable
ALTER TABLE "products" ADD COLUMN     "badges" TEXT[],
ADD COLUMN     "flavorProfile" JSONB,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "roast" TEXT;
