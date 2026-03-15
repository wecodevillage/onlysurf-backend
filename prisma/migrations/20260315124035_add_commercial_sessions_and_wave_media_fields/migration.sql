-- CreateEnum
CREATE TYPE "WaveMediaType" AS ENUM ('VIDEO', 'PHOTO');

-- AlterEnum
ALTER TYPE "SessionType" ADD VALUE 'COMMERCIAL';

-- DropForeignKey
ALTER TABLE "waves" DROP CONSTRAINT "waves_videoAssetId_fkey";

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "photoPrice" DOUBLE PRECISION,
ADD COLUMN     "videoPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "waves" ADD COLUMN     "mediaType" "WaveMediaType" NOT NULL DEFAULT 'VIDEO',
ADD COLUMN     "originalFileUrl" TEXT,
ALTER COLUMN "videoAssetId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "waves" ADD CONSTRAINT "waves_videoAssetId_fkey" FOREIGN KEY ("videoAssetId") REFERENCES "video_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
