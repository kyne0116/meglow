-- CreateEnum
CREATE TYPE "SubjectCode" AS ENUM ('ENGLISH', 'CHINESE', 'MATH');

-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('FIRST_TERM', 'SECOND_TERM', 'FULL_VOLUME', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "TextbookNodeType" AS ENUM ('VOLUME', 'UNIT', 'LESSON', 'SECTION', 'TOPIC', 'SPECIAL');

-- CreateEnum
CREATE TYPE "ContentItemType" AS ENUM ('WORD', 'CHARACTER', 'WORD_GROUP', 'TEXT', 'PARAGRAPH', 'CONCEPT', 'FORMULA', 'EXAMPLE', 'EXERCISE', 'READING_QUESTION', 'SPEAKING_PROMPT', 'AUDIO_MATERIAL');

-- CreateEnum
CREATE TYPE "BindingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'REVIEWING', 'APPROVED', 'REJECTED', 'PUBLISHED', 'OFFLINE');

-- AlterTable
ALTER TABLE "LearningPush" ADD COLUMN     "contentVersionSnapshotJson" JSONB,
ADD COLUMN     "textbookContextJson" JSONB;

-- AlterTable
ALTER TABLE "LearningTask" ADD COLUMN     "contentVersionSnapshotJson" JSONB,
ADD COLUMN     "textbookContextJson" JSONB;

-- AlterTable
ALTER TABLE "LearningSessionItem" ADD COLUMN     "contentVersionSnapshotJson" JSONB;

-- CreateTable
CREATE TABLE "Subject" (
    "id" UUID NOT NULL,
    "code" "SubjectCode" NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publisher" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "shortName" VARCHAR(50),
    "region" VARCHAR(50),
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookEdition" (
    "id" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "publisherId" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "curriculumYear" INTEGER,
    "regionScope" VARCHAR(100),
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextbookEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookVolume" (
    "id" UUID NOT NULL,
    "editionId" UUID NOT NULL,
    "grade" INTEGER NOT NULL,
    "semester" "SemesterType" NOT NULL,
    "volumeLabel" VARCHAR(50) NOT NULL,
    "k12Stage" "K12Stage" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextbookVolume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookNode" (
    "id" UUID NOT NULL,
    "volumeId" UUID NOT NULL,
    "parentId" UUID,
    "nodeType" "TextbookNodeType" NOT NULL,
    "nodeCode" VARCHAR(50),
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "depth" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLeaf" BOOLEAN NOT NULL DEFAULT false,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextbookNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePoint" (
    "id" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "difficultyLevel" INTEGER NOT NULL DEFAULT 1,
    "k12Stage" "K12Stage",
    "tagsJson" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "itemType" "ContentItemType" NOT NULL,
    "canonicalKey" VARCHAR(120),
    "title" VARCHAR(255) NOT NULL,
    "summary" VARCHAR(500),
    "difficultyLevel" INTEGER NOT NULL DEFAULT 1,
    "k12Stage" "K12Stage",
    "isReusable" BOOLEAN NOT NULL DEFAULT true,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "currentVersionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItemVersion" (
    "id" UUID NOT NULL,
    "contentItemId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(255) NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "changeSummary" VARCHAR(500),
    "createdBy" VARCHAR(50),
    "approvedBy" VARCHAR(50),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItemVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAsset" (
    "id" UUID NOT NULL,
    "contentItemId" UUID NOT NULL,
    "contentVersionId" UUID,
    "assetType" VARCHAR(50) NOT NULL,
    "uri" VARCHAR(500) NOT NULL,
    "format" VARCHAR(50),
    "metadataJson" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookNodeKnowledgePoint" (
    "id" UUID NOT NULL,
    "textbookNodeId" UUID NOT NULL,
    "knowledgePointId" UUID NOT NULL,
    "relationType" VARCHAR(50),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TextbookNodeKnowledgePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookNodeContentItem" (
    "id" UUID NOT NULL,
    "textbookNodeId" UUID NOT NULL,
    "contentItemId" UUID NOT NULL,
    "contentVersionId" UUID,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextbookNodeContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItemKnowledgePoint" (
    "id" UUID NOT NULL,
    "contentItemId" UUID NOT NULL,
    "knowledgePointId" UUID NOT NULL,
    "relationType" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentItemKnowledgePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildSubjectBinding" (
    "id" UUID NOT NULL,
    "childId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "editionId" UUID NOT NULL,
    "volumeId" UUID NOT NULL,
    "currentNodeId" UUID,
    "grade" INTEGER NOT NULL,
    "semester" "SemesterType" NOT NULL,
    "k12Stage" "K12Stage" NOT NULL,
    "status" "BindingStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildSubjectBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildSubjectProgress" (
    "id" UUID NOT NULL,
    "childSubjectBindingId" UUID NOT NULL,
    "currentNodeId" UUID,
    "lastCompletedNodeId" UUID,
    "completedNodeCount" INTEGER NOT NULL DEFAULT 0,
    "masteryJson" JSONB,
    "lastStudiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildSubjectProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnglishWordContentItemMap" (
    "id" UUID NOT NULL,
    "englishWordId" UUID NOT NULL,
    "contentItemId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnglishWordContentItemMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_code_key" ON "Publisher"("code");

-- CreateIndex
CREATE INDEX "TextbookEdition_subjectId_isEnabled_idx" ON "TextbookEdition"("subjectId", "isEnabled");

-- CreateIndex
CREATE INDEX "TextbookEdition_publisherId_idx" ON "TextbookEdition"("publisherId");

-- CreateIndex
CREATE UNIQUE INDEX "TextbookEdition_subjectId_code_key" ON "TextbookEdition"("subjectId", "code");

-- CreateIndex
CREATE INDEX "TextbookVolume_editionId_grade_semester_idx" ON "TextbookVolume"("editionId", "grade", "semester");

-- CreateIndex
CREATE INDEX "TextbookVolume_k12Stage_idx" ON "TextbookVolume"("k12Stage");

-- CreateIndex
CREATE UNIQUE INDEX "TextbookVolume_editionId_grade_semester_version_key" ON "TextbookVolume"("editionId", "grade", "semester", "version");

-- CreateIndex
CREATE INDEX "TextbookNode_volumeId_parentId_sortOrder_idx" ON "TextbookNode"("volumeId", "parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "TextbookNode_volumeId_nodeType_idx" ON "TextbookNode"("volumeId", "nodeType");

-- CreateIndex
CREATE INDEX "KnowledgePoint_subjectId_difficultyLevel_idx" ON "KnowledgePoint"("subjectId", "difficultyLevel");

-- CreateIndex
CREATE INDEX "KnowledgePoint_k12Stage_idx" ON "KnowledgePoint"("k12Stage");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePoint_subjectId_code_key" ON "KnowledgePoint"("subjectId", "code");

-- CreateIndex
CREATE INDEX "ContentItem_subjectId_itemType_idx" ON "ContentItem"("subjectId", "itemType");

-- CreateIndex
CREATE INDEX "ContentItem_canonicalKey_idx" ON "ContentItem"("canonicalKey");

-- CreateIndex
CREATE INDEX "ContentItem_k12Stage_difficultyLevel_idx" ON "ContentItem"("k12Stage", "difficultyLevel");

-- CreateIndex
CREATE INDEX "ContentItemVersion_contentItemId_reviewStatus_idx" ON "ContentItemVersion"("contentItemId", "reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItemVersion_contentItemId_version_key" ON "ContentItemVersion"("contentItemId", "version");

-- CreateIndex
CREATE INDEX "ContentAsset_contentItemId_sortOrder_idx" ON "ContentAsset"("contentItemId", "sortOrder");

-- CreateIndex
CREATE INDEX "ContentAsset_contentVersionId_idx" ON "ContentAsset"("contentVersionId");

-- CreateIndex
CREATE INDEX "TextbookNodeKnowledgePoint_knowledgePointId_idx" ON "TextbookNodeKnowledgePoint"("knowledgePointId");

-- CreateIndex
CREATE UNIQUE INDEX "TextbookNodeKnowledgePoint_textbookNodeId_knowledgePointId_key" ON "TextbookNodeKnowledgePoint"("textbookNodeId", "knowledgePointId");

-- CreateIndex
CREATE INDEX "TextbookNodeContentItem_contentItemId_idx" ON "TextbookNodeContentItem"("contentItemId");

-- CreateIndex
CREATE INDEX "TextbookNodeContentItem_contentVersionId_idx" ON "TextbookNodeContentItem"("contentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "TextbookNodeContentItem_textbookNodeId_contentItemId_key" ON "TextbookNodeContentItem"("textbookNodeId", "contentItemId");

-- CreateIndex
CREATE INDEX "ContentItemKnowledgePoint_knowledgePointId_idx" ON "ContentItemKnowledgePoint"("knowledgePointId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItemKnowledgePoint_contentItemId_knowledgePointId_key" ON "ContentItemKnowledgePoint"("contentItemId", "knowledgePointId");

-- CreateIndex
CREATE INDEX "ChildSubjectBinding_childId_subjectId_status_idx" ON "ChildSubjectBinding"("childId", "subjectId", "status");

-- CreateIndex
CREATE INDEX "ChildSubjectBinding_editionId_volumeId_idx" ON "ChildSubjectBinding"("editionId", "volumeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildSubjectProgress_childSubjectBindingId_key" ON "ChildSubjectProgress"("childSubjectBindingId");

-- CreateIndex
CREATE INDEX "ChildSubjectProgress_currentNodeId_idx" ON "ChildSubjectProgress"("currentNodeId");

-- CreateIndex
CREATE INDEX "ChildSubjectProgress_lastCompletedNodeId_idx" ON "ChildSubjectProgress"("lastCompletedNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishWordContentItemMap_englishWordId_key" ON "EnglishWordContentItemMap"("englishWordId");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishWordContentItemMap_contentItemId_key" ON "EnglishWordContentItemMap"("contentItemId");

-- AddForeignKey
ALTER TABLE "TextbookEdition" ADD CONSTRAINT "TextbookEdition_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookEdition" ADD CONSTRAINT "TextbookEdition_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookVolume" ADD CONSTRAINT "TextbookVolume_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "TextbookEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookNode" ADD CONSTRAINT "TextbookNode_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "TextbookVolume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookNode" ADD CONSTRAINT "TextbookNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TextbookNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePoint" ADD CONSTRAINT "KnowledgePoint_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItemVersion" ADD CONSTRAINT "ContentItemVersion_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_contentVersionId_fkey" FOREIGN KEY ("contentVersionId") REFERENCES "ContentItemVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookNodeKnowledgePoint" ADD CONSTRAINT "TextbookNodeKnowledgePoint_textbookNodeId_fkey" FOREIGN KEY ("textbookNodeId") REFERENCES "TextbookNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookNodeKnowledgePoint" ADD CONSTRAINT "TextbookNodeKnowledgePoint_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookNodeContentItem" ADD CONSTRAINT "TextbookNodeContentItem_textbookNodeId_fkey" FOREIGN KEY ("textbookNodeId") REFERENCES "TextbookNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookNodeContentItem" ADD CONSTRAINT "TextbookNodeContentItem_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookNodeContentItem" ADD CONSTRAINT "TextbookNodeContentItem_contentVersionId_fkey" FOREIGN KEY ("contentVersionId") REFERENCES "ContentItemVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItemKnowledgePoint" ADD CONSTRAINT "ContentItemKnowledgePoint_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItemKnowledgePoint" ADD CONSTRAINT "ContentItemKnowledgePoint_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSubjectBinding" ADD CONSTRAINT "ChildSubjectBinding_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSubjectBinding" ADD CONSTRAINT "ChildSubjectBinding_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSubjectBinding" ADD CONSTRAINT "ChildSubjectBinding_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "TextbookEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSubjectBinding" ADD CONSTRAINT "ChildSubjectBinding_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "TextbookVolume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSubjectBinding" ADD CONSTRAINT "ChildSubjectBinding_currentNodeId_fkey" FOREIGN KEY ("currentNodeId") REFERENCES "TextbookNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSubjectProgress" ADD CONSTRAINT "ChildSubjectProgress_childSubjectBindingId_fkey" FOREIGN KEY ("childSubjectBindingId") REFERENCES "ChildSubjectBinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSubjectProgress" ADD CONSTRAINT "ChildSubjectProgress_currentNodeId_fkey" FOREIGN KEY ("currentNodeId") REFERENCES "TextbookNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSubjectProgress" ADD CONSTRAINT "ChildSubjectProgress_lastCompletedNodeId_fkey" FOREIGN KEY ("lastCompletedNodeId") REFERENCES "TextbookNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnglishWordContentItemMap" ADD CONSTRAINT "EnglishWordContentItemMap_englishWordId_fkey" FOREIGN KEY ("englishWordId") REFERENCES "EnglishWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnglishWordContentItemMap" ADD CONSTRAINT "EnglishWordContentItemMap_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
