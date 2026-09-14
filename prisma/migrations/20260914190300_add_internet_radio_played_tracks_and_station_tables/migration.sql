-- CreateTable
CREATE TABLE "internet_radio_stations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "url" VARCHAR(250) NOT NULL,

    CONSTRAINT "internet_radio_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internet_radio_tracks" (
    "id" SERIAL NOT NULL,
    "station_id" INTEGER NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "loaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internet_radio_tracks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "internet_radio_tracks" ADD CONSTRAINT "internet_radio_tracks_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "internet_radio_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
