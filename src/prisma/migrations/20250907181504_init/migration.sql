-- CreateTable
CREATE TABLE `access_secret` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(255) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `live_stream_favourites` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `emp_Id` INTEGER NULL,
    `park_camera_Id` INTEGER NULL,
    `office_camera_Id` INTEGER NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `emp_Id`(`emp_Id`),
    INDEX `office_camera_Id`(`office_camera_Id`),
    INDEX `park_camera_Id`(`park_camera_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `office_streams` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `office_Id` INTEGER NULL,
    `stream_url` VARCHAR(255) NULL,
    `stream_api_key` VARCHAR(255) NULL,
    `stream_path` VARCHAR(255) NULL,
    `password` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `office_Id`(`office_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offices` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `office_Id` VARCHAR(255) NULL,
    `office_english_name` VARCHAR(255) NULL,
    `office_arabic_name` VARCHAR(255) NULL,
    `image` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `office_Id`(`office_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offices_attendance` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `office_Id` INTEGER NULL,
    `person_Id` INTEGER NULL,
    `entry_time` TIMESTAMP(0) NULL,
    `exit_time` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `office_Id`(`office_Id`),
    INDEX `person_Id`(`person_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offices_cameras` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `office_Id` INTEGER NULL,
    `camera_Id` VARCHAR(255) NULL,
    `camera_english_name` VARCHAR(255) NULL,
    `camera_arabic_name` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `ip_address` VARCHAR(45) NULL,
    `last_active_date` DATE NULL,
    `last_active_time` TIME(0) NULL,
    `status` VARCHAR(50) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `office_Id`(`office_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offices_sentiment_analysis` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `office_Id` INTEGER NULL,
    `person_Id` VARCHAR(255) NULL,
    `detection_Id` VARCHAR(100) NULL,
    `person_name` VARCHAR(255) NULL,
    `person_image` VARCHAR(255) NULL,
    `gender` VARCHAR(50) NULL,
    `check_in_image` VARCHAR(255) NULL,
    `sentiment_of` ENUM('employee', 'visitor') NULL,
    `check_in_date` DATE NULL,
    `check_in_time` TIME(0) NULL,
    `check_in_sentiment` VARCHAR(50) NULL,
    `entry_camera_Id` INTEGER NULL,
    `check_out_date` DATE NULL,
    `check_out_time` TIME(0) NULL,
    `check_out_capture` VARCHAR(255) NULL,
    `check_out_sentiment` VARCHAR(50) NULL,
    `exit_camera_Id` INTEGER NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `entry_camera_Id`(`entry_camera_Id`),
    INDEX `exit_camera_Id`(`exit_camera_Id`),
    INDEX `office_Id`(`office_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `park_cameras` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `camera_Id` VARCHAR(255) NULL,
    `camera_english_name` VARCHAR(255) NULL,
    `camera_arabic_name` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `ip_address` VARCHAR(45) NULL,
    `last_active_date` DATE NULL,
    `last_active_time` TIME(0) NULL,
    `status` VARCHAR(50) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `park_Id`(`park_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `park_streams` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `stream_url` VARCHAR(255) NULL,
    `stream_api_key` VARCHAR(255) NULL,
    `stream_path` VARCHAR(255) NULL,
    `password` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `park_Id`(`park_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `park_zones` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `zone_Id` VARCHAR(255) NULL,
    `zone_english_name` VARCHAR(255) NULL,
    `zone_arabic_name` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `device_ip` VARCHAR(45) NULL,
    `web_api` VARCHAR(255) NULL,
    `status` VARCHAR(50) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `park_Id`(`park_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parks` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` VARCHAR(255) NULL,
    `park_english_name` VARCHAR(255) NULL,
    `park_arabic_name` VARCHAR(255) NULL,
    `image` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `park_Id`(`park_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parks_attendance` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `person_Id` INTEGER NULL,
    `entry_time` TIMESTAMP(0) NULL,
    `exit_time` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `park_Id`(`park_Id`),
    INDEX `person_Id`(`person_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parks_behaviour_alerts` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `person_Id` VARCHAR(255) NULL,
    `camera_Id` INTEGER NULL,
    `detection_Id` VARCHAR(255) NULL,
    `detection_code` VARCHAR(255) NULL,
    `detection_date` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `detection_time` TIME(0) NULL,
    `description` VARCHAR(255) NULL,
    `detected_behaviour` VARCHAR(255) NULL,
    `is_employee` BOOLEAN NULL DEFAULT false,
    `snap_shot` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `camera_Id`(`camera_Id`),
    INDEX `park_Id`(`park_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parks_intrusion_detection` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `location` VARCHAR(255) NULL,
    `camera_Id` INTEGER NULL,
    `occurrence_date` DATE NULL,
    `occurrence_time` TIME(0) NULL,
    `snap_shot` VARCHAR(255) NULL,
    `posted_to_intranet_date` DATE NULL,
    `posted_to_intranet_time` TIME(0) NULL,
    `detection_Id` VARCHAR(100) NULL,
    `detection_date` TIMESTAMP(0) NULL,
    `detection_time` TIME(0) NULL,
    `description` TEXT NULL,
    `is_employee` BOOLEAN NULL DEFAULT false,
    `current_status` VARCHAR(100) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `camera_Id`(`camera_Id`),
    INDEX `park_Id`(`park_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parks_irrigation_job_history` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `zone_Id` INTEGER NULL,
    `job_Id` VARCHAR(255) NULL,
    `job_started_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `job_completed_at` DATETIME(0) NULL,
    `job_status` VARCHAR(50) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `park_Id`(`park_Id`),
    INDEX `zone_Id`(`zone_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parks_landscaping` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `case_Id` VARCHAR(255) NULL,
    `location` VARCHAR(255) NULL,
    `snap_shot` VARCHAR(255) NULL,
    `type` VARCHAR(100) NULL,
    `status` VARCHAR(50) NULL,
    `detection_Id` VARCHAR(100) NULL,
    `detection_date` TIMESTAMP(0) NULL,
    `detection_time` TIME(0) NULL,
    `description` TEXT NULL,
    `current_status` VARCHAR(100) NULL,
    `camera_Id` INTEGER NULL,
    `after_image` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `park_Id`(`park_Id`),
    INDEX `camera_Id`(`camera_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parks_litter_detection` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `case_Id` VARCHAR(255) NULL,
    `location` VARCHAR(255) NULL,
    `occurrence_date` DATE NULL,
    `occurrence_time` TIME(0) NULL,
    `snap_shot` VARCHAR(255) NULL,
    `status` VARCHAR(50) NULL,
    `detection_Id` VARCHAR(100) NULL,
    `detection_date` TIMESTAMP(0) NULL,
    `detection_time` TIME(0) NULL,
    `description` TEXT NULL,
    `current_status` VARCHAR(100) NULL,
    `camera_Id` INTEGER NULL,
    `after_image` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `park_Id`(`park_Id`),
    INDEX `camera_Id`(`camera_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `parks_sentiment_analysis` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `person_Id` VARCHAR(255) NULL,
    `detection_Id` VARCHAR(100) NULL,
    `person_name` VARCHAR(255) NULL,
    `person_image` VARCHAR(255) NULL,
    `gender` VARCHAR(50) NULL,
    `check_in_image` VARCHAR(255) NULL,
    `sentiment_of` ENUM('employee', 'visitor') NULL,
    `check_in_date` DATE NULL,
    `check_in_time` TIME(0) NULL,
    `check_in_sentiment` VARCHAR(50) NULL,
    `entry_camera_Id` INTEGER NULL,
    `check_out_date` DATE NULL,
    `check_out_time` TIME(0) NULL,
    `check_out_capture` VARCHAR(255) NULL,
    `check_out_sentiment` VARCHAR(50) NULL,
    `exit_camera_Id` INTEGER NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `entry_camera_Id`(`entry_camera_Id`),
    INDEX `exit_camera_Id`(`exit_camera_Id`),
    INDEX `park_Id`(`park_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parks_smoking_detection` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `park_Id` INTEGER NULL,
    `location` VARCHAR(255) NULL,
    `camera_Id` INTEGER NULL,
    `occurrence_date` DATE NULL,
    `occurrence_time` TIME(0) NULL,
    `snap_shot` VARCHAR(255) NULL,
    `posted_to_intranet_date` DATE NULL,
    `posted_to_intranet_time` TIME(0) NULL,
    `detection_Id` VARCHAR(100) NULL,
    `detection_date` TIMESTAMP(0) NULL,
    `detection_time` TIME(0) NULL,
    `description` TEXT NULL,
    `is_employee` BOOLEAN NULL DEFAULT false,
    `current_status` VARCHAR(100) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `camera_Id`(`camera_Id`),
    INDEX `park_Id`(`park_Id`),
    PRIMARY KEY (`Id`)
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
CREATE TABLE `users` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `emp_Id` VARCHAR(255) NULL,
    `gender` VARCHAR(50) NULL,
    `emp__eng_name` VARCHAR(255) NULL,
    `emp__arabic_name` VARCHAR(255) NULL,
    `country_code` VARCHAR(10) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `dep_eng_name` VARCHAR(255) NULL,
    `dep_arabic_name` VARCHAR(255) NULL,
    `desig_eng_name` VARCHAR(255) NULL,
    `desig_arabic_name` VARCHAR(255) NULL,
    `unit_eng_name` VARCHAR(255) NULL,
    `unit_arabic_name` VARCHAR(255) NULL,
    `committe_eng_name` VARCHAR(255) NULL,
    `committe_arabic_name` VARCHAR(255) NULL,
    `ai_engine_access` BOOLEAN NULL DEFAULT false,
    `last_login` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `role_Id` INTEGER NULL,

    INDEX `role_Id`(`role_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users_permissions` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_Id` INTEGER NULL,
    `dashboard_view` BOOLEAN NULL DEFAULT false,
    `role_permission_view` BOOLEAN NULL DEFAULT false,
    `role_permission_add` BOOLEAN NULL DEFAULT false,
    `role_permission_update` BOOLEAN NULL DEFAULT false,
    `offices_view` BOOLEAN NULL DEFAULT false,
    `offices_add` BOOLEAN NULL DEFAULT false,
    `offices_update` BOOLEAN NULL DEFAULT false,
    `parks_view` BOOLEAN NULL DEFAULT false,
    `parks_add` BOOLEAN NULL DEFAULT false,
    `parks_update` BOOLEAN NULL DEFAULT false,
    `system_report_view` BOOLEAN NULL DEFAULT false,
    `alerts_view` BOOLEAN NULL DEFAULT false,
    `office_attendance_view` BOOLEAN NULL DEFAULT false,
    `office_attendance_add` BOOLEAN NULL DEFAULT false,
    `office_attendance_update` BOOLEAN NULL DEFAULT false,
    `office_footfall_view` BOOLEAN NULL DEFAULT false,
    `office_footfall_add` BOOLEAN NULL DEFAULT false,
    `office_footfall_update` BOOLEAN NULL DEFAULT false,
    `office_sentimental_view` BOOLEAN NULL DEFAULT false,
    `office_sentimental_add` BOOLEAN NULL DEFAULT false,
    `office_sentimental_update` BOOLEAN NULL DEFAULT false,
    `park_attendance_view` BOOLEAN NULL DEFAULT false,
    `park_attendance_add` BOOLEAN NULL DEFAULT false,
    `park_attendance_update` BOOLEAN NULL DEFAULT false,
    `park_footfall_view` BOOLEAN NULL DEFAULT false,
    `park_footfall_add` BOOLEAN NULL DEFAULT false,
    `park_footfall_update` BOOLEAN NULL DEFAULT false,
    `park_sentimental_view` BOOLEAN NULL DEFAULT false,
    `park_sentimental_add` BOOLEAN NULL DEFAULT false,
    `park_sentimental_update` BOOLEAN NULL DEFAULT false,
    `park_irrigation_view` BOOLEAN NULL DEFAULT false,
    `park_irrigation_add` BOOLEAN NULL DEFAULT false,
    `park_irrigation_update` BOOLEAN NULL DEFAULT false,
    `park_landscaping_view` BOOLEAN NULL DEFAULT false,
    `park_landscaping_add` BOOLEAN NULL DEFAULT false,
    `park_landscaping_update` BOOLEAN NULL DEFAULT false,
    `park_litter_detection_view` BOOLEAN NULL DEFAULT false,
    `park_litter_detection_add` BOOLEAN NULL DEFAULT false,
    `park_litter_detection_update` BOOLEAN NULL DEFAULT false,
    `park_intrusion_detection_view` BOOLEAN NULL DEFAULT false,
    `park_intrusion_detection_add` BOOLEAN NULL DEFAULT false,
    `park_intrusion_detection_update` BOOLEAN NULL DEFAULT false,
    `park_smoking_detection_view` BOOLEAN NULL DEFAULT false,
    `park_smoking_detection_add` BOOLEAN NULL DEFAULT false,
    `park_smoking_detection_update` BOOLEAN NULL DEFAULT false,
    `my_account_view` BOOLEAN NULL DEFAULT false,
    `settings_view` BOOLEAN NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `role_Id`(`role_Id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users_roles` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NULL,
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`Id`)
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

-- AddForeignKey
ALTER TABLE `live_stream_favourites` ADD CONSTRAINT `live_stream_favourites_ibfk_1` FOREIGN KEY (`emp_Id`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `live_stream_favourites` ADD CONSTRAINT `live_stream_favourites_ibfk_2` FOREIGN KEY (`park_camera_Id`) REFERENCES `park_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `live_stream_favourites` ADD CONSTRAINT `live_stream_favourites_ibfk_3` FOREIGN KEY (`office_camera_Id`) REFERENCES `offices_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `office_streams` ADD CONSTRAINT `office_streams_ibfk_1` FOREIGN KEY (`office_Id`) REFERENCES `offices`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `offices_attendance` ADD CONSTRAINT `offices_attendance_ibfk_1` FOREIGN KEY (`office_Id`) REFERENCES `offices`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offices_attendance` ADD CONSTRAINT `offices_attendance_ibfk_2` FOREIGN KEY (`person_Id`) REFERENCES `users`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offices_cameras` ADD CONSTRAINT `offices_cameras_ibfk_1` FOREIGN KEY (`office_Id`) REFERENCES `offices`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `offices_sentiment_analysis` ADD CONSTRAINT `offices_sentiment_analysis_ibfk_1` FOREIGN KEY (`office_Id`) REFERENCES `offices`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `offices_sentiment_analysis` ADD CONSTRAINT `offices_sentiment_analysis_ibfk_2` FOREIGN KEY (`entry_camera_Id`) REFERENCES `offices_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `offices_sentiment_analysis` ADD CONSTRAINT `offices_sentiment_analysis_ibfk_3` FOREIGN KEY (`exit_camera_Id`) REFERENCES `offices_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `park_cameras` ADD CONSTRAINT `park_cameras_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `park_streams` ADD CONSTRAINT `park_streams_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `park_zones` ADD CONSTRAINT `park_zones_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_attendance` ADD CONSTRAINT `parks_attendance_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parks_attendance` ADD CONSTRAINT `parks_attendance_ibfk_2` FOREIGN KEY (`person_Id`) REFERENCES `users`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parks_behaviour_alerts` ADD CONSTRAINT `parks_behaviour_alerts_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_behaviour_alerts` ADD CONSTRAINT `parks_behaviour_alerts_ibfk_2` FOREIGN KEY (`camera_Id`) REFERENCES `park_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_intrusion_detection` ADD CONSTRAINT `parks_intrusion_detection_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_intrusion_detection` ADD CONSTRAINT `parks_intrusion_detection_ibfk_2` FOREIGN KEY (`camera_Id`) REFERENCES `park_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_irrigation_job_history` ADD CONSTRAINT `parks_irrigation_job_history_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_irrigation_job_history` ADD CONSTRAINT `parks_irrigation_job_history_ibfk_2` FOREIGN KEY (`zone_Id`) REFERENCES `park_zones`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_landscaping` ADD CONSTRAINT `parks_landscaping_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_landscaping` ADD CONSTRAINT `parks_landscaping_ibfk_2` FOREIGN KEY (`camera_Id`) REFERENCES `park_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_litter_detection` ADD CONSTRAINT `parks_litter_detection_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_litter_detection` ADD CONSTRAINT `parks_litter_detection_ibfk_2` FOREIGN KEY (`camera_Id`) REFERENCES `park_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ticket_details_table` ADD CONSTRAINT `ticket_details_table_litterDetectionId_fkey` FOREIGN KEY (`litterDetectionId`) REFERENCES `parks_litter_detection`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_details_table` ADD CONSTRAINT `ticket_details_table_landscapingId_fkey` FOREIGN KEY (`landscapingId`) REFERENCES `parks_landscaping`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parks_sentiment_analysis` ADD CONSTRAINT `parks_sentiment_analysis_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_sentiment_analysis` ADD CONSTRAINT `parks_sentiment_analysis_ibfk_2` FOREIGN KEY (`entry_camera_Id`) REFERENCES `park_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_sentiment_analysis` ADD CONSTRAINT `parks_sentiment_analysis_ibfk_3` FOREIGN KEY (`exit_camera_Id`) REFERENCES `park_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_smoking_detection` ADD CONSTRAINT `parks_smoking_detection_ibfk_1` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_smoking_detection` ADD CONSTRAINT `parks_smoking_detection_ibfk_2` FOREIGN KEY (`camera_Id`) REFERENCES `park_cameras`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `intranet_posting_history` ADD CONSTRAINT `intranet_posting_history_smokingDetectionId_fkey` FOREIGN KEY (`smokingDetectionId`) REFERENCES `parks_smoking_detection`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intranet_posting_history` ADD CONSTRAINT `intranet_posting_history_intrusionDetectionId_fkey` FOREIGN KEY (`intrusionDetectionId`) REFERENCES `parks_intrusion_detection`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_Id`) REFERENCES `users_roles`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `users_permissions` ADD CONSTRAINT `users_permissions_ibfk_1` FOREIGN KEY (`role_Id`) REFERENCES `users_roles`(`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `parks_footfall_analysis` ADD CONSTRAINT `parks_footfall_analysis_park_Id_fkey` FOREIGN KEY (`park_Id`) REFERENCES `parks`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offices_footfall_analysis` ADD CONSTRAINT `offices_footfall_analysis_office_Id_fkey` FOREIGN KEY (`office_Id`) REFERENCES `offices`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offices_footfall_analysis` ADD CONSTRAINT `offices_footfall_analysis_person_Id_fkey` FOREIGN KEY (`person_Id`) REFERENCES `users`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
