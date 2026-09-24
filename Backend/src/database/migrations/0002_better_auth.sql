-- =============================================================================
-- 0002_better_auth.sql — Better Auth Core Schema & Safe User Migration
-- =============================================================================
-- Standard PostgreSQL schema required by Better Auth.
-- Supports email/password, session management, Google OAuth, and server-side RBAC.
-- Safe & idempotent: creates tables if not exists, and safely copies existing users.

-- 1. Table: "user" -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "role" TEXT NOT NULL DEFAULT 'USER' CHECK ("role" IN ('USER', 'ADMIN')),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "user_email_idx" ON "user"("email");

-- 2. Table: "session" --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session"("token");

-- 3. Table: "account" --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");
CREATE INDEX IF NOT EXISTS "account_provider_idx" ON "account"("providerId", "accountId");

-- 4. Table: "verification" ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");

-- Drop triggers temporarily to avoid recursive loops during initial sync
DROP TRIGGER IF EXISTS trg_sync_better_auth_user ON "user";
DROP TRIGGER IF EXISTS trg_sync_legacy_user ON public.users;

-- 5. Safe Migration of Existing Users from public.users ----------------------
-- Copy users from public.users table into "user", mapping roles to USER or ADMIN.
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    INSERT INTO "user" ("id", "name", "email", "emailVerified", "image", "role", "isActive", "createdAt", "updatedAt")
    SELECT 
      u.id::text,
      COALESCE(u.name, split_part(u.email, '@', 1)),
      LOWER(u.email),
      TRUE,
      u.avatar_url,
      CASE WHEN UPPER(u.role) = 'ADMIN' THEN 'ADMIN' ELSE 'USER' END,
      COALESCE(u.is_active, TRUE),
      COALESCE(u.created_at, NOW()),
      COALESCE(u.updated_at, NOW())
    FROM public.users u
    ON CONFLICT ("email") DO UPDATE SET
      "name" = EXCLUDED."name",
      "image" = COALESCE(EXCLUDED."image", "user"."image"),
      "updatedAt" = NOW();

    -- Create credential accounts for migrated password users
    INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
    SELECT 
      'migrated_acc_' || u.id::text,
      u.id::text,
      'credential',
      u.id::text,
      u.password_hash,
      NOW(),
      NOW()
    FROM public.users u
    WHERE u.password_hash IS NOT NULL AND u.password_hash <> ''
    ON CONFLICT ("id") DO NOTHING;
  END IF;
END $$;

-- 6. Bidirectional Sync Trigger: "user" -> public.users
CREATE OR REPLACE FUNCTION sync_better_auth_user_to_legacy()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      is_active,
      avatar_url,
      credits,
      plan,
      auth_provider,
      created_at,
      updated_at
    ) VALUES (
      CASE 
        WHEN NEW.id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN NEW.id::uuid 
        ELSE gen_random_uuid() 
      END,
      LOWER(NEW.email),
      NEW.name,
      LOWER(NEW.role),
      COALESCE(NEW."isActive", TRUE),
      NEW.image,
      50,
      'free_trial',
      'better-auth',
      COALESCE(NEW."createdAt", NOW()),
      COALESCE(NEW."updatedAt", NOW())
    )
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active,
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_better_auth_user
AFTER INSERT OR UPDATE ON "user"
FOR EACH ROW EXECUTE FUNCTION sync_better_auth_user_to_legacy();

-- 7. Bidirectional Sync Trigger: public.users -> "user"
CREATE OR REPLACE FUNCTION sync_legacy_user_to_better_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user') THEN
    UPDATE "user" SET
      role = UPPER(NEW.role),
      "isActive" = NEW.is_active,
      name = NEW.name,
      "updatedAt" = NOW()
    WHERE id = NEW.id::text OR LOWER(email) = LOWER(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_legacy_user
AFTER UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION sync_legacy_user_to_better_auth();



