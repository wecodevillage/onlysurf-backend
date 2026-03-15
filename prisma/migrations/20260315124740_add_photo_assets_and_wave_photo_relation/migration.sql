-- AlterTable
ALTER TABLE "waves" ADD COLUMN     "photoAssetId" TEXT;

-- CreateTable
CREATE TABLE "photo_assets" (
    "id" TEXT NOT NULL,
    "gcsBucket" TEXT NOT NULL,
    "gcsObjectPath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "fileSizeBytes" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "photo_assets_gcsObjectPath_key" ON "photo_assets"("gcsObjectPath");

-- CreateIndex
CREATE INDEX "photo_assets_gcsBucket_idx" ON "photo_assets"("gcsBucket");

-- CreateIndex
CREATE INDEX "waves_photoAssetId_idx" ON "waves"("photoAssetId");

-- AddForeignKey
ALTER TABLE "waves" ADD CONSTRAINT "waves_photoAssetId_fkey" FOREIGN KEY ("photoAssetId") REFERENCES "photo_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
