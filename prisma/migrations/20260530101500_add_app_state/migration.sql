CREATE TABLE "AppState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppState_userId_key_key" ON "AppState"("userId", "key");

CREATE INDEX "AppState_userId_idx" ON "AppState"("userId");

ALTER TABLE "AppState" ADD CONSTRAINT "AppState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
