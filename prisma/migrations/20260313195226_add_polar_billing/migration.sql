-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "username" TEXT,
    "bio" TEXT,
    "github" TEXT,
    "twitter" TEXT,
    "website" TEXT,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "subscriptionStatus" TEXT,
    "polarCustomerId" TEXT,
    "polarCustomerExternalId" TEXT,
    "polarSubscriptionId" TEXT,
    "polarProductId" TEXT,
    "polarCheckoutId" TEXT,
    "subscriptionCurrentPeriodEnd" DATETIME,
    "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionCanceledAt" DATETIME,
    "planUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_user" ("bio", "createdAt", "email", "emailVerified", "github", "id", "image", "isProfilePublic", "name", "twitter", "updatedAt", "username", "website") SELECT "bio", "createdAt", "email", "emailVerified", "github", "id", "image", "isProfilePublic", "name", "twitter", "updatedAt", "username", "website" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
CREATE UNIQUE INDEX "user_polarCustomerId_key" ON "user"("polarCustomerId");
CREATE UNIQUE INDEX "user_polarSubscriptionId_key" ON "user"("polarSubscriptionId");
CREATE INDEX "user_createdAt_idx" ON "user"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
