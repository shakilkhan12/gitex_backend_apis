-- AlterTable
ALTER TABLE `offices` ADD COLUMN `location` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `offices_cameras` ADD COLUMN `location` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `park_cameras` ADD COLUMN `location` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `park_zones` ADD COLUMN `location` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `parks` ADD COLUMN `location` VARCHAR(255) NULL;
