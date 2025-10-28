import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import '@/lib/env-validation'; // Validate environment variables on startup

/**
 * NextAuth Configuration
 *
 * Handles Google OAuth sign-in for user authentication
 * Using JWT sessions with basic profile information only
 * Emails are sent via Resend API (no Gmail permissions needed)
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ].join(' '),
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log('[NextAuth] signIn callback triggered', {
        provider: account?.provider,
        userEmail: user?.email,
      });

      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user exists
          let dbUser = await prisma.users.findUnique({
            where: { email: user.email },
          });

          // Create or update user
          if (!dbUser) {
            console.log('[NextAuth] Creating new user:', user.email);
            dbUser = await prisma.users.create({
              data: {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                emailVerified: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
            console.log('[NextAuth] User created with ID:', dbUser.id);
          } else {
            console.log('[NextAuth] Existing user found:', dbUser.id);
            // Update user info
            await prisma.users.update({
              where: { id: dbUser.id },
              data: {
                name: user.name || dbUser.name,
                image: user.image || dbUser.image,
                updatedAt: new Date(),
              },
            });
          }

          // Store user ID in the user object for JWT
          user.id = dbUser.id;
        } catch (error) {
          console.error('[NextAuth] Error in signIn callback:', error);
          console.error('[NextAuth] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          });

          // Block sign-in on any error - don't allow partial/broken state
          return '/auth/error?error=OAuthCreateAccount';
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      console.log('[NextAuth] session callback triggered', {
        userId: token?.id,
        userEmail: token?.email,
      });

      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('[NextAuth Error]', code, metadata);
    },
    warn(code) {
      console.warn('[NextAuth Warn]', code);
    },
    debug(code, metadata) {
      console.log('[NextAuth Debug]', code, metadata);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
