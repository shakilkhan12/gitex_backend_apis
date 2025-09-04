/*
  Warnings:

  - You are about to drop the column `attendance_of` on the `offices_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `check_in_date` on the `offices_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `check_in_time` on the `offices_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `check_out_date` on the `offices_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `check_out_time` on the `offices_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `mood` on the `offices_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `snap_shot` on the `offices_attendance` table. All the data in the column will be lost.
  - You are about to alter the column `person_Id` on the `offices_attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Int`.
  - You are about to drop the column `attendance_of` on the `parks_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `check_in_date` on the `parks_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `check_in_time` on the `parks_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `check_out_date` on the `parks_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `check_out_time` on the `parks_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `mood` on the `parks_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `snap_shot` on the `parks_attendance` table. All the data in the column will be lost.
  - You are about to alter the column `person_Id` on the `parks_attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `offices_attendance` DROP FOREIGN KEY `offices_attendance_ibfk_1`;

-- DropForeignKey
ALTER TABLE `parks_attendance` DROP FOREIGN KEY `parks_attendance_ibfk_1`;

-- AlterTable
ALTER TABLE `offices_attendance` DROP COLUMN `attendance_of`,
    DROP COLUMN `check_in_date`,
    DROP COLUMN `check_in_time`,
    DROP COLUMN `check_out_date`,
    DROP COLUMN `check_out_time`,
    DROP COLUMN `mood`,
    DROP COLUMN `snap_shot`,
    ADD COLUMN `entry_time` TIMESTAMP(0) NULL,
    ADD COLUMN `exit_time` TIMESTAMP(0) NULL,
    MODIFY `person_Id` INTEGER NULL;

-- AlterTable
ALTER TABLE `offices_sentiment_analysis` ADD COLUMN `check_in_image` VARCHAR(255) NULL,
    ADD COLUMN `check_out_sentiment` VARCHAR(50) NULL,
    ADD COLUMN `detection_Id` VARCHAR(100) NULL,
    ADD COLUMN `gender` VARCHAR(50) NULL,
    ADD COLUMN `person_image` VARCHAR(255) NULL,
    ADD COLUMN `person_name` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `parks_attendance` DROP COLUMN `attendance_of`,
    DROP COLUMN `check_in_date`,
    DROP COLUMN `check_in_time`,
    DROP COLUMN `check_out_date`,
    DROP COLUMN `check_out_time`,
    DROP COLUMN `mood`,
    DROP COLUMN `snap_shot`,
    ADD COLUMN `entry_time` TIMESTAMP(0) NULL,
    ADD COLUMN `exit_time` TIMESTAMP(0) NULL,
    MODIFY `person_Id` INTEGER NULL;

-- AlterTable
ALTER TABLE `parks_behaviour_alerts` ADD COLUMN `description` VARCHAR(255) NULL,
    ADD COLUMN `detection_Id` VARCHAR(255) NULL,
    ADD COLUMN `detection_code` VARCHAR(255) NULL,
    ADD COLUMN `detection_date` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `detection_time` TIME(0) NULL,
    ADD COLUMN `is_employee` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `parks_intrusion_detection` ADD COLUMN `current_status` VARCHAR(100) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `detection_Id` VARCHAR(100) NULL,
    ADD COLUMN `detection_date` TIMESTAMP(0) NULL,
    ADD COLUMN `detection_time` TIME(0) NULL,
    ADD COLUMN `is_employee` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `parks_landscaping` ADD COLUMN `after_image` VARCHAR(255) NULL,
    ADD COLUMN `camera_Id` INTEGER NULL,
    ADD COLUMN `current_status` VARCHAR(100) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `detection_Id` VARCHAR(100) NULL,
    ADD COLUMN `detection_date` TIMESTAMP(0) NULL,
    ADD COLUMN `detection_time` TIME(0) NULL;

-- AlterTable
ALTER TABLE `parks_litter_detection` ADD COLUMN `after_image` VARCHAR(255) NULL,
    ADD COLUMN `camera_Id` INTEGER NULL,
    ADD COLUMN `current_status` VARCHAR(100) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `detection_Id` VARCHAR(100) NULL,
    ADD COLUMN `detection_date` TIMESTAMP(0) NULL,
    ADD COLUMN `detection_time` TIME(0) NULL;

-- AlterTable
ALTER TABLE `parks_sentiment_analysis` ADD COLUMN `check_in_image` VARCHAR(255) NULL,
    ADD COLUMN `check_out_sentiment` VARCHAR(50) NULL,
    ADD COLUMN `detection_Id` VARCHAR(100) NULL,
    ADD COLUMN `gender` VARCHAR(50) NULL,
    ADD COLUMN `person_image` VARCHAR(255) NULL,
    ADD COLUMN `person_name` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `parks_smoking_detection` ADD COLUMN `current_status` VARCHAR(100) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `detection_Id` VARCHAR(100) NULL,
    ADD COLUMN `detection_date` TIMESTAMP(0) NULL,
    ADD COLUMN `detection_time` TIME(0) NULL,
    ADD COLUMN `is_employee` BOOLEAN NULL DEFAULT false;

-- CreateTable
CREATE TABLE `ticket_details_table` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(50) NULL,
    `date` DATE NULL,
    `time` TIME(0) NULL,
    `comments` TEXT NULL,
    `image` VARCHAR(255) NULL,
    `abc1` VARCHAR(100) NULL,
    `abc2` VARCHAR(100) NULL,
    `abc3` VARCHAR(100) NULL,
    `abc4` VARCHAR(100) NULL,
    `litterDetectionId` INTEGER NULL,
    `landscapingId` INTEGER NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `litterDetectionId_idx`(`litterDetectionId`),
    INDEX `landscapingId_idx`(`landscapingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `intranet_posting_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `smokingDetectionId` INTEGER NULL,
    `intrusionDetectionId` INTEGER NULL,
    `title` VARCHAR(255) NULL,
    `intranet_id` VARCHAR(100) NULL,
    `comments` TEXT NULL,
    `date` DATE NULL,
    `time` TIME(0) NULL,
    `abc1` VARCHAR(100) NULL,
    `abc2` VARCHAR(100) NULL,
    `abc3` VARCHAR(100) NULL,

    INDEX `smokingDetectionId_idx`(`smokingDetectionId`),
    INDEX `intrusionDetectionId_idx`(`intrusionDetectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parks_footfall_analysis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NOT NULL,
    `detection_Id` VARCHAR(191) NOT NULL,
    `person_Id` INTEGER NOT NULL,
    `gender` VARCHAR(191) NULL,
    `is_child` BOOLEAN NOT NULL DEFAULT false,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `detected_camera_Id` VARCHAR(191) NOT NULL,
    `detected_camera_name` VARCHAR(191) NULL,
    `abc1` VARCHAR(191) NULL,
    `abc2` VARCHAR(191) NULL,
    `abc3` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offices_footfall_analysis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `office_Id` INTEGER NOT NULL,
    `detection_Id` VARCHAR(191) NOT NULL,
    `person_Id` INTEGER NOT NULL,
    `gender` VARCHAR(191) NULL,
    `is_child` BOOLEAN NOT NULL DEFAULT false,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `detected_camera_Id` VARCHAR(191) NOT NULL,
    `detected_camera_name` VARCHAR(191) NULL,
    `abc1` VARCHAR(191) NULL,
    `abc2` VARCHAR(191) NULL,
    `abc3` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `person_Id` ON `offices_attendance`(`person_Id`);

-- CreateIndex
CREATE INDEX `person_Id` ON `parks_attendance`(`person_Id`);

-- CreateIndex
CREATE INDEX `camera_Id` ON `parks_landscaping`(`camera_Id`);

-- CreateIndex
CREATE INDEX `camera_Id` ON `parks_litter_detection`(`camera_Id`);

-- AddForeignKey
ALTER TABLE `offices_attendance` ADD CONSTRAINT `offices_attendance_ibfk_1` FOREIGN KEY (`office_Id`) REFERENCES `offices`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offices_attendance` ADD CONSTRAINT `offices_attendance_ibfk_2` FOREIGN KEY (`person_Id`) REFERENCES `users`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parks_attendance` ADD CONSTRAINT `parks_attendance_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parks_attendance` ADD CONSTRAINT `parks_attendance_ibfk_2` FOREIGN KEY (`person_Id`) REFERENCES `users`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parks_landscaping` ADD CONSTRAINT `parks_landscaping_ibfk_2` FOREIGN KEY (`camera_Id`) REFERENCES `park_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_litter_detection` ADD CONSTRAINT `parks_litter_detection_ibfk_2` FOREIGN KEY (`camera_Id`) REFERENCES `park_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ticket_details_table` ADD CONSTRAINT `ticket_details_table_litterDetectionId_fkey` FOREIGN KEY (`litterDetectionId`) REFERENCES `parks_litter_detection`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_details_table` ADD CONSTRAINT `ticket_details_table_landscapingId_fkey` FOREIGN KEY (`landscapingId`) REFERENCES `parks_landscaping`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intranet_posting_history` ADD CONSTRAINT `intranet_posting_history_smokingDetectionId_fkey` FOREIGN KEY (`smokingDetectionId`) REFERENCES `parks_smoking_detection`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intranet_posting_history` ADD CONSTRAINT `intranet_posting_history_intrusionDetectionId_fkey` FOREIGN KEY (`intrusionDetectionId`) REFERENCES `parks_intrusion_detection`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parks_footfall_analysis` ADD CONSTRAINT `parks_footfall_analysis_park_Id_fkey` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offices_footfall_analysis` ADD CONSTRAINT `offices_footfall_analysis_office_Id_fkey` FOREIGN KEY (`office_Id`) REFERENCES `offices`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offices_footfall_analysis` ADD CONSTRAINT `offices_footfall_analysis_person_Id_fkey` FOREIGN KEY (`person_Id`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
