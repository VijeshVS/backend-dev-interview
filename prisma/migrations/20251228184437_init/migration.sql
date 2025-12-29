-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "ExperienceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD');

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "package_ctc" DOUBLE PRECISION,
    "role" TEXT,
    "job_type" "JobType",
    "difficulty_level" "DifficultyLevel",
    "rounds_count" INTEGER,
    "status" "ExperienceStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rounds" (
    "id" SERIAL NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "round_order" INTEGER NOT NULL,
    "round_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coding_Problems" (
    "id" SERIAL NOT NULL,
    "round_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "description" TEXT,
    "constraints" TEXT,
    "sample_testcases" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coding_Problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technical_Questions" (
    "id" SERIAL NOT NULL,
    "round_id" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Technical_Questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience_Upvotes" (
    "user_id" INTEGER NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Experience_Upvotes_pkey" PRIMARY KEY ("user_id","experience_id")
);

-- CreateTable
CREATE TABLE "Comments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "experience_id" INTEGER NOT NULL,
    "comment_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- AddForeignKey
ALTER TABLE "Experiences" ADD CONSTRAINT "Experiences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rounds" ADD CONSTRAINT "Rounds_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "Experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coding_Problems" ADD CONSTRAINT "Coding_Problems_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "Rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technical_Questions" ADD CONSTRAINT "Technical_Questions_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "Rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience_Upvotes" ADD CONSTRAINT "Experience_Upvotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience_Upvotes" ADD CONSTRAINT "Experience_Upvotes_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "Experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "Experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
