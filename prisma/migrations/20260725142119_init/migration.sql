-- CreateTable
CREATE TABLE "Adapter" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "baseModel" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "method" TEXT,
    "hfRepoId" TEXT NOT NULL,
    "hfPath" TEXT NOT NULL,
    "rank" INTEGER,
    "loraAlpha" INTEGER,
    "loraDropout" DOUBLE PRECISION,
    "targetModules" TEXT,
    "sizeBytes" BIGINT,
    "source" TEXT NOT NULL DEFAULT 'community',
    "uploaderUsername" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Adapter_slug_key" ON "Adapter"("slug");

-- CreateIndex
CREATE INDEX "Adapter_baseModel_idx" ON "Adapter"("baseModel");

-- CreateIndex
CREATE INDEX "Adapter_domain_idx" ON "Adapter"("domain");

-- CreateIndex
CREATE INDEX "Adapter_source_idx" ON "Adapter"("source");
