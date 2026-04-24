ALTER TABLE "profile"
RENAME COLUMN "rankedRating" TO "rankedElo";

ALTER TABLE "profile"
ADD COLUMN "casualMmr" INTEGER NOT NULL DEFAULT 1000;
