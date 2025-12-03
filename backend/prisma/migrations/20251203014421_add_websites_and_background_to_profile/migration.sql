-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "backgroundImageUrl" TEXT,
ADD COLUMN "websites" TEXT[] DEFAULT ARRAY[]::TEXT[];
