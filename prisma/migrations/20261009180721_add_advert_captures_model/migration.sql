-- CreateTable
CREATE TABLE "advert_captures" (
    "id" SERIAL NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_sec" DOUBLE PRECISION NOT NULL,
    "file_hash" VARCHAR(64) NOT NULL,
    "blob_url" VARCHAR(500),
    "local_path" VARCHAR(500),
    "recognition_state" TEXT NOT NULL DEFAULT 'PENDING',
    "acoustid_id" VARCHAR(100),
    "musicbrainz_id" VARCHAR(100),
    "artist" VARCHAR(250),
    "title" VARCHAR(250),
    "album" VARCHAR(250),
    "year" INTEGER,
    "score" DOUBLE PRECISION,

    CONSTRAINT "advert_captures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "advert_captures_file_hash_idx" ON "advert_captures"("file_hash");

-- CreateIndex
CREATE INDEX "advert_captures_captured_at_idx" ON "advert_captures"("captured_at");
