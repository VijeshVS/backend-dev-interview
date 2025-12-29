-- DropForeignKey
ALTER TABLE "Coding_Problems" DROP CONSTRAINT "Coding_Problems_round_id_fkey";

-- DropForeignKey
ALTER TABLE "Comments" DROP CONSTRAINT "Comments_experience_id_fkey";

-- DropForeignKey
ALTER TABLE "Comments" DROP CONSTRAINT "Comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Experience_Upvotes" DROP CONSTRAINT "Experience_Upvotes_experience_id_fkey";

-- DropForeignKey
ALTER TABLE "Experience_Upvotes" DROP CONSTRAINT "Experience_Upvotes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Experiences" DROP CONSTRAINT "Experiences_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Rounds" DROP CONSTRAINT "Rounds_experience_id_fkey";

-- DropForeignKey
ALTER TABLE "Technical_Questions" DROP CONSTRAINT "Technical_Questions_round_id_fkey";

-- AddForeignKey
ALTER TABLE "Experiences" ADD CONSTRAINT "Experiences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rounds" ADD CONSTRAINT "Rounds_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "Experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coding_Problems" ADD CONSTRAINT "Coding_Problems_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "Rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technical_Questions" ADD CONSTRAINT "Technical_Questions_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "Rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience_Upvotes" ADD CONSTRAINT "Experience_Upvotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience_Upvotes" ADD CONSTRAINT "Experience_Upvotes_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "Experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "Experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
