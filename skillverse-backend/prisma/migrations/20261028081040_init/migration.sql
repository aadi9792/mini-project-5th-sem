-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "name" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guardianId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guardianId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guardianId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guardianId" TEXT NOT NULL,
    "confirmedGuardianStatus" BOOLEAN NOT NULL,
    "dataStorageConsent" BOOLEAN NOT NULL,
    "nonMedicalDeviceAck" BOOLEAN NOT NULL,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "consentTextVersion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guardianId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "interests" TEXT NOT NULL,
    "tutorialCompletedAt" DATETIME,
    "activeTheme" TEXT,
    "totalStars" INTEGER NOT NULL DEFAULT 0,
    "totalCoins" INTEGER NOT NULL DEFAULT 0,
    "avatarBaseFace" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChildPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "q1Sound" TEXT NOT NULL,
    "q2Motion" TEXT NOT NULL,
    "q3Transitions" TEXT NOT NULL,
    "q4AttentionSpan" TEXT NOT NULL,
    "q5SocialComfort" TEXT NOT NULL,
    "q6RegulationStrategy" TEXT NOT NULL,
    "q7CheckInStyle" TEXT NOT NULL,
    "q8InstructionStyle" TEXT NOT NULL,
    "q9GuidanceNeeded" TEXT NOT NULL,
    "q10Predictability" TEXT NOT NULL,
    "q11Motor" TEXT NOT NULL,
    "q12FirstFocusArea" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompanionTemplate" (
    "speciesId" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "personalityBlurb" TEXT NOT NULL,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    "unlockLevel" INTEGER
);

-- CreateTable
CREATE TABLE "ChildCompanion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "customName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "adoptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ZoneCheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GameDifficultyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GameProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "completedSessionsCount" INTEGER NOT NULL DEFAULT 0,
    "bossBattlesWonCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "QuestCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "questType" TEXT NOT NULL,
    "gameId" TEXT,
    "mode" TEXT,
    "realLifeQuestId" TEXT,
    "remindersLevel" TEXT,
    "starsAwarded" INTEGER NOT NULL,
    "coinsAwarded" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ShopItemCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "priceCoins" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "OwnedShopItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CollectibleCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "displayName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "OwnedCollectible" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "collectibleId" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BadgeCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emoji" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "EarnedBadge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RealLifeQuestTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RealLifeQuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "templateId" TEXT,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "rewardStars" INTEGER NOT NULL DEFAULT 10,
    "rewardCoins" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScreenTimeSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT
);

-- CreateTable
CREATE TABLE "PlaySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_email_key" ON "Guardian"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_googleId_key" ON "Guardian"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ChildPreferences_childId_key" ON "ChildPreferences"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "GameDifficultyProfile_childId_gameId_key" ON "GameDifficultyProfile"("childId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameProgress_childId_gameId_key" ON "GameProgress"("childId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "ScreenTimeSettings_childId_key" ON "ScreenTimeSettings"("childId");
