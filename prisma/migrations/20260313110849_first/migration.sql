-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ATHLETE', 'COACH', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE_ATHLETE', 'PRO_SURFER', 'COACH_STARTER', 'COACH_PRO', 'ACADEMY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID');

-- CreateEnum
CREATE TYPE "SocialNetworkType" AS ENUM ('INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'YOUTUBE', 'TWITTER', 'LINKEDIN', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "PrivacyLevel" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "Stance" AS ENUM ('GOOFY', 'REGULAR');

-- CreateEnum
CREATE TYPE "SurferLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ATHLETE', 'COACH', 'OWNER');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('TRAINING', 'FREE_SURF');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PREPARING', 'READY', 'ERRORED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "WebhookSource" AS ENUM ('MUX', 'STRIPE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ATHLETE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "stance" "Stance",
    "level" "SurferLevel",
    "country" TEXT,
    "locale" TEXT DEFAULT 'en-US',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_networks" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "SocialNetworkType" NOT NULL,
    "value" TEXT NOT NULL,
    "privacy" "PrivacyLevel" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_photos" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "location" TEXT,
    "website" TEXT,
    "ownerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_memberships" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'ATHLETE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "academyId" TEXT,
    "coachId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "SessionType" NOT NULL DEFAULT 'TRAINING',
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "photoUrl" TEXT,
    "conditions" TEXT,
    "notes" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_rosters" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_rosters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_assets" (
    "id" TEXT NOT NULL,
    "muxAssetId" TEXT NOT NULL,
    "muxPlaybackId" TEXT,
    "status" "VideoStatus" NOT NULL DEFAULT 'PREPARING',
    "durationSeconds" DOUBLE PRECISION,
    "aspectRatio" TEXT,
    "maxWidth" INTEGER,
    "maxHeight" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waves" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "academyId" TEXT,
    "videoAssetId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "startTime" DOUBLE PRECISION,
    "endTime" DOUBLE PRECISION,
    "durationSeconds" DOUBLE PRECISION,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wave_tags" (
    "id" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "taggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wave_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_waves" (
    "id" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "academyId" TEXT,
    "coachId" TEXT NOT NULL,
    "durationSnapshot" DOUBLE PRECISION NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_waves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE_ATHLETE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "source" "WebhookSource" NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_firebaseUid_idx" ON "users"("firebaseUid");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "social_networks_profileId_idx" ON "social_networks"("profileId");

-- CreateIndex
CREATE INDEX "services_profileId_idx" ON "services"("profileId");

-- CreateIndex
CREATE INDEX "services_isActive_idx" ON "services"("isActive");

-- CreateIndex
CREATE INDEX "profile_photos_profileId_idx" ON "profile_photos"("profileId");

-- CreateIndex
CREATE INDEX "profile_photos_profileId_order_idx" ON "profile_photos"("profileId", "order");

-- CreateIndex
CREATE INDEX "academies_ownerId_idx" ON "academies"("ownerId");

-- CreateIndex
CREATE INDEX "academies_isActive_idx" ON "academies"("isActive");

-- CreateIndex
CREATE INDEX "academy_memberships_academyId_idx" ON "academy_memberships"("academyId");

-- CreateIndex
CREATE INDEX "academy_memberships_userId_idx" ON "academy_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_memberships_academyId_userId_key" ON "academy_memberships"("academyId", "userId");

-- CreateIndex
CREATE INDEX "sessions_academyId_idx" ON "sessions"("academyId");

-- CreateIndex
CREATE INDEX "sessions_coachId_idx" ON "sessions"("coachId");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "sessions_scheduledAt_idx" ON "sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "session_rosters_sessionId_idx" ON "session_rosters"("sessionId");

-- CreateIndex
CREATE INDEX "session_rosters_athleteId_idx" ON "session_rosters"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "session_rosters_sessionId_athleteId_key" ON "session_rosters"("sessionId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "video_assets_muxAssetId_key" ON "video_assets"("muxAssetId");

-- CreateIndex
CREATE INDEX "video_assets_muxAssetId_idx" ON "video_assets"("muxAssetId");

-- CreateIndex
CREATE INDEX "video_assets_status_idx" ON "video_assets"("status");

-- CreateIndex
CREATE INDEX "waves_sessionId_idx" ON "waves"("sessionId");

-- CreateIndex
CREATE INDEX "waves_academyId_idx" ON "waves"("academyId");

-- CreateIndex
CREATE INDEX "waves_videoAssetId_idx" ON "waves"("videoAssetId");

-- CreateIndex
CREATE INDEX "wave_tags_waveId_idx" ON "wave_tags"("waveId");

-- CreateIndex
CREATE INDEX "wave_tags_athleteId_idx" ON "wave_tags"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "wave_tags_waveId_athleteId_key" ON "wave_tags"("waveId", "athleteId");

-- CreateIndex
CREATE INDEX "saved_waves_waveId_idx" ON "saved_waves"("waveId");

-- CreateIndex
CREATE INDEX "saved_waves_athleteId_idx" ON "saved_waves"("athleteId");

-- CreateIndex
CREATE INDEX "saved_waves_academyId_idx" ON "saved_waves"("academyId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_waves_waveId_athleteId_key" ON "saved_waves"("waveId", "athleteId");

-- CreateIndex
CREATE INDEX "scores_waveId_idx" ON "scores"("waveId");

-- CreateIndex
CREATE INDEX "scores_coachId_idx" ON "scores"("coachId");

-- CreateIndex
CREATE INDEX "notes_waveId_idx" ON "notes"("waveId");

-- CreateIndex
CREATE INDEX "notes_coachId_idx" ON "notes"("coachId");

-- CreateIndex
CREATE INDEX "payments_academyId_idx" ON "payments"("academyId");

-- CreateIndex
CREATE INDEX "payments_athleteId_idx" ON "payments"("athleteId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_stripeCustomerId_idx" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "subscriptions_stripeSubscriptionId_idx" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "webhook_events_source_idx" ON "webhook_events"("source");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

-- CreateIndex
CREATE INDEX "webhook_events_eventId_idx" ON "webhook_events"("eventId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_networks" ADD CONSTRAINT "social_networks_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academies" ADD CONSTRAINT "academies_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_memberships" ADD CONSTRAINT "academy_memberships_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_memberships" ADD CONSTRAINT "academy_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_rosters" ADD CONSTRAINT "session_rosters_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_rosters" ADD CONSTRAINT "session_rosters_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waves" ADD CONSTRAINT "waves_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waves" ADD CONSTRAINT "waves_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waves" ADD CONSTRAINT "waves_videoAssetId_fkey" FOREIGN KEY ("videoAssetId") REFERENCES "video_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wave_tags" ADD CONSTRAINT "wave_tags_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "waves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wave_tags" ADD CONSTRAINT "wave_tags_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_waves" ADD CONSTRAINT "saved_waves_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "waves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_waves" ADD CONSTRAINT "saved_waves_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_waves" ADD CONSTRAINT "saved_waves_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "waves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "waves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
