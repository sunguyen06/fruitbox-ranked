CREATE TYPE "MatchKind" AS ENUM ('PRIVATE', 'CASUAL', 'RANKED');
CREATE TYPE "MatchVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE "MatchStatus" AS ENUM ('WAITING', 'ACTIVE', 'FINISHED', 'CANCELLED');
CREATE TYPE "MatchCompletionReason" AS ENUM ('NORMAL', 'MANUAL_STOP', 'EMPTY_ROOM');

CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profile" (
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "bio" TEXT,
    "rankedRating" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "match" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT,
    "seed" TEXT NOT NULL,
    "kind" "MatchKind" NOT NULL,
    "visibility" "MatchVisibility" NOT NULL,
    "status" "MatchStatus" NOT NULL,
    "completionReason" "MatchCompletionReason",
    "hostUserId" TEXT,
    "playerCapacity" INTEGER NOT NULL,
    "countdownDurationMs" INTEGER NOT NULL,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "configJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "match_participant" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayNameSnapshot" TEXT NOT NULL,
    "handleSnapshot" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "score" INTEGER,
    "placement" INTEGER,
    "wasHost" BOOLEAN NOT NULL DEFAULT false,
    "didFinish" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_participant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");
CREATE UNIQUE INDEX "verification_identifier_value_key" ON "verification"("identifier", "value");
CREATE UNIQUE INDEX "profile_handle_key" ON "profile"("handle");
CREATE UNIQUE INDEX "match_participant_matchId_userId_key" ON "match_participant"("matchId", "userId");
CREATE INDEX "match_hostUserId_createdAt_idx" ON "match"("hostUserId", "createdAt");
CREATE INDEX "match_kind_status_createdAt_idx" ON "match"("kind", "status", "createdAt");
CREATE INDEX "match_participant_userId_joinedAt_idx" ON "match_participant"("userId", "joinedAt");

ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match" ADD CONSTRAINT "match_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "match_participant" ADD CONSTRAINT "match_participant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match_participant" ADD CONSTRAINT "match_participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
