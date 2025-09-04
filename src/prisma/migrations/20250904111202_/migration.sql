/*
  Warnings:

  - A unique constraint covering the columns `[office_Id,camera_Id]` on the table `offices_cameras` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[park_Id,camera_Id]` on the table `park_cameras` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[park_Id,zone_Id]` on the table `park_zones` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `offices_cameras` ADD COLUMN `attendance` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `footfall` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sentiment` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `park_cameras` ADD COLUMN `attendance` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `behaviour` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `footfall` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `intrusion` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `irrigation` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `landscaping` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `litter_detection` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `password` VARCHAR(255) NULL,
    ADD COLUMN `sentiment` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `smoking_detection` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `stream_api_key` VARCHAR(255) NULL,
    ADD COLUMN `stream_path` VARCHAR(255) NULL,
    ADD COLUMN `stream_url` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `TermsPrivacy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `terms` TEXT NULL,
    `privacyPolicy` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FAQ` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `offices_cameras_office_Id_camera_Id_key` ON `offices_cameras`(`office_Id`, `camera_Id`);

-- CreateIndex
CREATE UNIQUE INDEX `park_cameras_park_Id_camera_Id_key` ON `park_cameras`(`park_Id`, `camera_Id`);

-- CreateIndex
CREATE UNIQUE INDEX `park_zones_park_Id_zone_Id_key` ON `park_zones`(`park_Id`, `zone_Id`);
