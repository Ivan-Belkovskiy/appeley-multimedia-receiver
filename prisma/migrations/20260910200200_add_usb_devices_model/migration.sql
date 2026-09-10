-- CreateTable
CREATE TABLE "usb_devices" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "primaryColor" VARCHAR(9) NOT NULL,
    "secondaryColor" VARCHAR(9) NOT NULL,

    CONSTRAINT "usb_devices_pkey" PRIMARY KEY ("id")
);
