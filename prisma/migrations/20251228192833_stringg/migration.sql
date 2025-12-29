/*
  Warnings:

  - Made the column `package_ctc` on table `Experiences` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Experiences" ALTER COLUMN "package_ctc" SET NOT NULL,
ALTER COLUMN "package_ctc" SET DATA TYPE TEXT;
