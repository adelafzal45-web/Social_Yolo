import { createAuthClient } from 'better-auth/react';
import { oneTapClient } from 'better-auth/client/plugins';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    oneTapClient({
      clientId: googleClientId,
      autoSelect: false,
      cancelOnTapOutside: true,
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
