-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DONOR', 'RECIPIENT', 'ASPIRING_PARENT');

-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('OMNIVORE', 'VEGETARIAN', 'VEGAN', 'KOSHER', 'HALAL', 'GLUTEN_FREE');

-- CreateEnum
CREATE TYPE "CMVStatus" AS ENUM ('POSITIVE', 'NEGATIVE', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "AnonymityType" AS ENUM ('IDENTITY_DISCLOSURE', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('DRIVER_LICENSE', 'PASSPORT');

-- CreateEnum
CREATE TYPE "GenderIdentity" AS ENUM ('WOMAN', 'MAN', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('DONOR_SERVICES', 'SURROGACY_SERVICES');

-- CreateEnum
CREATE TYPE "PairingType" AS ENUM ('DONOR_BANK', 'PRIVATE_DONATION_ONLY', 'PRIVATE_CO_PARENTING', 'PRIVATE_RELATIONSHIP', 'PRIVATE_MARRIAGE', 'PRIVATE_SURROGATE');

-- CreateEnum
CREATE TYPE "GameteType" AS ENUM ('SPERM', 'EGG', 'EMBRYO');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED');

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole",
    "accessRoleId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "gender" "GenderIdentity",
    "serviceType" "ServiceType",
    "interestedIn" "GameteType",
    "pairingTypes" "PairingType"[],
    "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_otp" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "user_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "legalName" TEXT,
    "dob" TIMESTAMP(3),
    "phoneNumber" TEXT,
    "address" TEXT,
    "babyPhotoUrl" TEXT,
    "currentPhotoUrl" TEXT,
    "education" TEXT,
    "occupation" TEXT,
    "nationality" TEXT,
    "diet" "DietType",
    "height" INTEGER,
    "weight" INTEGER,
    "bodyBuild" TEXT,
    "hairColor" TEXT,
    "eyeColor" TEXT,
    "race" TEXT,
    "orientation" TEXT,
    "bio" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHealth" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "hasDiabetes" BOOLEAN NOT NULL DEFAULT false,
    "hasHeartCondition" BOOLEAN NOT NULL DEFAULT false,
    "hasAutoimmune" BOOLEAN NOT NULL DEFAULT false,
    "hasCancer" BOOLEAN NOT NULL DEFAULT false,
    "hasNeuroDisorder" BOOLEAN NOT NULL DEFAULT false,
    "hasRespiratory" BOOLEAN NOT NULL DEFAULT false,
    "otherConditions" TEXT,
    "majorSurgeries" TEXT,
    "allergies" BOOLEAN NOT NULL DEFAULT false,
    "allergiesDetails" TEXT,
    "cmvStatus" "CMVStatus",
    "medications" TEXT,
    "mentalHealthHistory" TEXT,
    "biologicalChildren" BOOLEAN NOT NULL DEFAULT false,
    "reproductiveIssues" BOOLEAN NOT NULL DEFAULT false,
    "menstrualRegularity" BOOLEAN DEFAULT false,
    "pregnancyHistory" BOOLEAN DEFAULT false,
    "reproductiveConds" BOOLEAN NOT NULL DEFAULT false,
    "hivHepStatus" BOOLEAN NOT NULL DEFAULT false,
    "needleUsage" BOOLEAN NOT NULL DEFAULT false,
    "transfusionHistory" BOOLEAN NOT NULL DEFAULT false,
    "malariaRisk" BOOLEAN NOT NULL DEFAULT false,
    "zikaRisk" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGenetic" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "carrierConditions" TEXT[],
    "reportFileUrl" TEXT,

    CONSTRAINT "UserGenetic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompensation" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "isInterested" BOOLEAN NOT NULL DEFAULT false,
    "allowBidding" BOOLEAN NOT NULL DEFAULT false,
    "askingPrice" DECIMAL(10,2),
    "minAcceptedPrice" DECIMAL(10,2),
    "buyNowPrice" DECIMAL(10,2),

    CONSTRAINT "UserCompensation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLegal" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "consentAgreed" BOOLEAN NOT NULL DEFAULT false,
    "anonymityPreference" "AnonymityType" NOT NULL,
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLegal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityDocument" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "type" "DocType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billing_cycle" TEXT NOT NULL,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "status" "PlanStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_queue" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "target_user_id" UUID NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "discovery_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "user_a" UUID NOT NULL,
    "user_b" UUID NOT NULL,
    "matched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_users" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "blocked_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RolePermissions" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_slug_key" ON "Permission"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserHealth_userId_key" ON "UserHealth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGenetic_userId_key" ON "UserGenetic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompensation_userId_key" ON "UserCompensation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLegal_userId_key" ON "UserLegal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE INDEX "_RolePermissions_B_index" ON "_RolePermissions"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_accessRoleId_fkey" FOREIGN KEY ("accessRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_otp" ADD CONSTRAINT "user_otp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHealth" ADD CONSTRAINT "UserHealth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGenetic" ADD CONSTRAINT "UserGenetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompensation" ADD CONSTRAINT "UserCompensation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLegal" ADD CONSTRAINT "UserLegal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityDocument" ADD CONSTRAINT "IdentityDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_queue" ADD CONSTRAINT "discovery_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_queue" ADD CONSTRAINT "discovery_queue_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_a_fkey" FOREIGN KEY ("user_a") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_b_fkey" FOREIGN KEY ("user_b") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
