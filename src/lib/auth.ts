import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

// Extend the session type to include accessToken
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}

// Extend JWT type
interface ExtendedJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      const extToken = token as ExtendedJWT;

      // Initial sign in - persist tokens
      if (account) {
        return {
          ...extToken,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        } as ExtendedJWT;
      }

      // Token still valid
      if (extToken.expiresAt && Date.now() < extToken.expiresAt * 1000) {
        return extToken;
      }

      // Token expired - try to refresh
      if (extToken.refreshToken) {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: extToken.refreshToken,
            }),
          });

          const tokens = await response.json();

          if (!response.ok) throw tokens;

          return {
            ...extToken,
            accessToken: tokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
            // Keep old refresh token if new one not provided
            refreshToken: tokens.refresh_token ?? extToken.refreshToken,
          } as ExtendedJWT;
        } catch {
          return { ...extToken, error: "RefreshAccessTokenError" } as ExtendedJWT;
        }
      }

      return extToken;
    },
    async session({ session, token }) {
      const extToken = token as ExtendedJWT;
      session.accessToken = extToken.accessToken;
      session.error = extToken.error;
      return session;
    },
  },
});
