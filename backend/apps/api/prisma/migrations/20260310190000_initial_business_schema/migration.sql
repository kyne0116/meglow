-- CreateEnum
CREATE TYPE "ParentRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "K12Stage" AS ENUM ('LOWER_PRIMARY', 'MIDDLE_PRIMARY', 'UPPER_PRIMARY', 'JUNIOR_HIGH');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('ENGLISH');

-- CreateEnum
CREATE TYPE "PushStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'MODIFIED', 'REJECTED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "PushActionType" AS ENUM ('APPROVE', 'MODIFY', 'REJECT', 'POSTPONE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('APPROVED', 'MODIFIED', 'DELIVERED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "LearningItemType" AS ENUM ('WORD_MEANING', 'WORD_SPELLING', 'WORD_PRONUNCIATION');

-- CreateTable
CREATE TABLE "Parent" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "nickname" VARCHAR(50),
    "avatarUrl" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMembership" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "parentId" UUID NOT NULL,
    "role" "ParentRole" NOT NULL,
    "invitedByParentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyInvite" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "inviterParentId" UUID NOT NULL,
    "inviteePhone" VARCHAR(20) NOT NULL,
    "token" VARCHAR(100) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "gender" "Gender" NOT NULL,
    "birthDate" TIMESTAMP(3),
    "grade" INTEGER NOT NULL,
    "k12Stage" "K12Stage" NOT NULL,
    "avatarUrl" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "learningMemoryJson" JSONB NOT NULL,
    "cognitiveMemoryJson" JSONB NOT NULL,
    "personalityMemoryJson" JSONB NOT NULL,
    "teachingStrategyJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildGameProfile" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildGameProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildLearningSettings" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "subject" "SubjectType" NOT NULL,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "weekdayTimeWindows" JSONB NOT NULL,
    "weekendTimeWindows" JSONB NOT NULL,
    "dailyDurationMin" INTEGER NOT NULL,
    "wordsPerSession" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildLearningSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnglishWord" (
    "id" UUID NOT NULL,
    "value" VARCHAR(100) NOT NULL,
    "phonetic" VARCHAR(100),
    "meaningZh" VARCHAR(255) NOT NULL,
    "exampleSentence" VARCHAR(500),
    "imageHint" VARCHAR(255),
    "difficultyLevel" INTEGER NOT NULL DEFAULT 1,
    "k12Stage" "K12Stage" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnglishWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildWordProgress" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "wordId" UUID NOT NULL,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "correctStreak" INTEGER NOT NULL DEFAULT 0,
    "reviewStage" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildWordProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPush" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "summary" VARCHAR(255) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "expectedOutcome" VARCHAR(500) NOT NULL,
    "status" "PushStatus" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "contentJson" JSONB NOT NULL,
    "createdBy" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPush_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPushActionLog" (
    "id" UUID NOT NULL,
    "pushId" UUID NOT NULL,
    "action" "PushActionType" NOT NULL,
    "operatorParentId" UUID NOT NULL,
    "comment" VARCHAR(500),
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPushActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningTask" (
    "id" UUID NOT NULL,
    "pushId" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "summary" VARCHAR(255) NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "contentJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "subject" "SubjectType" NOT NULL,
    "status" "SessionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "summaryJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSessionItem" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "wordId" UUID,
    "itemType" "LearningItemType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "promptJson" JSONB NOT NULL,
    "correctAnswerJson" JSONB NOT NULL,
    "childAnswerJson" JSONB,
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PronunciationAttempt" (
    "id" UUID NOT NULL,
    "sessionItemId" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "audioUrl" VARCHAR(255) NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" VARCHAR(500),
    "provider" VARCHAR(50) NOT NULL,
    "providerRawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PronunciationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parent_phone_key" ON "Parent"("phone");

-- CreateIndex
CREATE INDEX "FamilyMembership_parentId_idx" ON "FamilyMembership"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMembership_familyId_parentId_key" ON "FamilyMembership"("familyId", "parentId");

-- CreateIndex
CREATE INDEX "VerificationCode_phone_createdAt_idx" ON "VerificationCode"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationCode_phone_expiresAt_idx" ON "VerificationCode"("phone", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyInvite_token_key" ON "FamilyInvite"("token");

-- CreateIndex
CREATE INDEX "FamilyInvite_familyId_idx" ON "FamilyInvite"("familyId");

-- CreateIndex
CREATE INDEX "FamilyInvite_inviteePhone_idx" ON "FamilyInvite"("inviteePhone");

-- CreateIndex
CREATE INDEX "Child_familyId_idx" ON "Child"("familyId");

-- CreateIndex
CREATE INDEX "Child_familyId_grade_idx" ON "Child"("familyId", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_childId_key" ON "ChildProfile"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildGameProfile_childId_key" ON "ChildGameProfile"("childId");

-- CreateIndex
CREATE INDEX "ChildLearningSettings_childId_idx" ON "ChildLearningSettings"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildLearningSettings_childId_subject_key" ON "ChildLearningSettings"("childId", "subject");

-- CreateIndex
CREATE INDEX "EnglishWord_k12Stage_difficultyLevel_idx" ON "EnglishWord"("k12Stage", "difficultyLevel");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishWord_value_k12Stage_key" ON "EnglishWord"("value", "k12Stage");

-- CreateIndex
CREATE INDEX "ChildWordProgress_childId_nextReviewAt_idx" ON "ChildWordProgress"("childId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "ChildWordProgress_childId_reviewStage_idx" ON "ChildWordProgress"("childId", "reviewStage");

-- CreateIndex
CREATE UNIQUE INDEX "ChildWordProgress_childId_wordId_key" ON "ChildWordProgress"("childId", "wordId");

-- CreateIndex
CREATE INDEX "LearningPush_childId_status_idx" ON "LearningPush"("childId", "status");

-- CreateIndex
CREATE INDEX "LearningPush_status_scheduledAt_idx" ON "LearningPush"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "LearningPushActionLog_pushId_createdAt_idx" ON "LearningPushActionLog"("pushId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningPushActionLog_operatorParentId_idx" ON "LearningPushActionLog"("operatorParentId");

-- CreateIndex
CREATE INDEX "LearningTask_childId_status_idx" ON "LearningTask"("childId", "status");

-- CreateIndex
CREATE INDEX "LearningTask_childId_scheduledAt_idx" ON "LearningTask"("childId", "scheduledAt");

-- CreateIndex
CREATE INDEX "LearningSession_taskId_idx" ON "LearningSession"("taskId");

-- CreateIndex
CREATE INDEX "LearningSession_childId_status_idx" ON "LearningSession"("childId", "status");

-- CreateIndex
CREATE INDEX "LearningSessionItem_sessionId_sequence_idx" ON "LearningSessionItem"("sessionId", "sequence");

-- CreateIndex
CREATE INDEX "LearningSessionItem_wordId_idx" ON "LearningSessionItem"("wordId");

-- CreateIndex
CREATE INDEX "PronunciationAttempt_sessionItemId_idx" ON "PronunciationAttempt"("sessionItemId");

-- CreateIndex
CREATE INDEX "PronunciationAttempt_childId_createdAt_idx" ON "PronunciationAttempt"("childId", "createdAt");

-- AddForeignKey
ALTER TABLE "FamilyMembership" ADD CONSTRAINT "FamilyMembership_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMembership" ADD CONSTRAINT "FamilyMembership_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyInvite" ADD CONSTRAINT "FamilyInvite_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildGameProfile" ADD CONSTRAINT "ChildGameProfile_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLearningSettings" ADD CONSTRAINT "ChildLearningSettings_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildWordProgress" ADD CONSTRAINT "ChildWordProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildWordProgress" ADD CONSTRAINT "ChildWordProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "EnglishWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPush" ADD CONSTRAINT "LearningPush_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPushActionLog" ADD CONSTRAINT "LearningPushActionLog_pushId_fkey" FOREIGN KEY ("pushId") REFERENCES "LearningPush"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPushActionLog" ADD CONSTRAINT "LearningPushActionLog_operatorParentId_fkey" FOREIGN KEY ("operatorParentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningTask" ADD CONSTRAINT "LearningTask_pushId_fkey" FOREIGN KEY ("pushId") REFERENCES "LearningPush"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningTask" ADD CONSTRAINT "LearningTask_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "LearningTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSessionItem" ADD CONSTRAINT "LearningSessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSessionItem" ADD CONSTRAINT "LearningSessionItem_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "EnglishWord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PronunciationAttempt" ADD CONSTRAINT "PronunciationAttempt_sessionItemId_fkey" FOREIGN KEY ("sessionItemId") REFERENCES "LearningSessionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
