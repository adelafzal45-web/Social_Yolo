import { betterAuth } from 'better-auth';
import { oneTap } from 'better-auth/plugins';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '';

const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ||
  '';

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USERNAME || process.env.DATABASE_USER || 'postgres'}:${encodeURIComponent(
    process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'admin',
  )}@${process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost'}:${
    process.env.DB_PORT || process.env.DATABASE_PORT || '5432'
  }/${process.env.DB_NAME || process.env.DATABASE_NAME || 'social_yolo'}`;

const isLocal =
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1');

export const auth = betterAuth({
  database: new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  }),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    'social-yolo-better-auth-secret-production-key-2026-secure',
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    password: {
      hash: async (password: string) => {
        return bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        return bcrypt.compare(password, hash);
      },
    },
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
  plugins: [
    oneTap({
      clientId: googleClientId,
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'USER',
        input: false, // SERVER-ONLY: Clients can never set or modify their own role
      },
      isActive: {
        type: 'boolean',
        defaultValue: true,
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
