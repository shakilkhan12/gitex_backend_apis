/*
  Warnings:

  - A unique constraint covering the columns `[job_Id]` on the table `parks_irrigation_job_history` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `parks_irrigation_job_history_job_Id_key` ON `parks_irrigation_job_history`(`job_Id`);
