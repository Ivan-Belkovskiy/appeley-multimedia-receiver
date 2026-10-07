-- AlterTable
ALTER TABLE "internet_radio_tracks" ADD COLUMN     "download_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_download_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "downloaded_tracks" (
    "id" SERIAL NOT NULL,
    "radio_track_id" INTEGER NOT NULL,
    "file_hash" VARCHAR(64) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size_bytes" INTEGER,
    "duration_sec" DOUBLE PRECISION,
    "target_type" VARCHAR(20) NOT NULL,
    "target_name" VARCHAR(100),
    "target_path" VARCHAR(500),
    "blob_url" VARCHAR(500),
    "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "downloaded_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internet_radio_capture_settings" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" VARCHAR(500) NOT NULL,
    "value_type" TEXT NOT NULL DEFAULT 'string',

    CONSTRAINT "internet_radio_capture_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receiver_instances" (
    "id" SERIAL NOT NULL,
    "device_ip" VARCHAR(40) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receiver_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "downloaded_tracks_file_hash_idx" ON "downloaded_tracks"("file_hash");

-- CreateIndex
CREATE UNIQUE INDEX "downloaded_tracks_radio_track_id_file_hash_target_name_key" ON "downloaded_tracks"("radio_track_id", "file_hash", "target_name");

-- CreateIndex
CREATE UNIQUE INDEX "internet_radio_capture_settings_key_key" ON "internet_radio_capture_settings"("key");

-- AddForeignKey
ALTER TABLE "downloaded_tracks" ADD CONSTRAINT "downloaded_tracks_radio_track_id_fkey" FOREIGN KEY ("radio_track_id") REFERENCES "internet_radio_tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
