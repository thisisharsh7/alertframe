import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { storeGmailTokens } from '@/lib/email-oauth';
import '@/lib/env-validation'; // Validate environment variables on startup

/**
 * NextAuth Configuration
 *
 * Handles Google OAuth sign-in and Gmail API access
 * Using JWT sessions with manual user management for better control
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
            'https://www.googleapis.com/auth/gmail.send', // Gmail send permission
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
        hasAccessToken: !!account?.access_token,
        hasRefreshToken: !!account?.refresh_token,
        scopes: account?.scope,
      });

      if (account?.provider === 'google' && user.email) {
        try {
          // Validate OAuth scopes - ensure gmail.send permission was granted
          const requiredScope = 'https://www.googleapis.com/auth/gmail.send';
          const grantedScopes = account.scope?.split(' ') || [];
          const hasGmailSendPermission = grantedScopes.includes(requiredScope);

          console.log('[NextAuth] OAuth scope validation:', {
            grantedScopes,
            hasGmailSendPermission,
          });

          if (!hasGmailSendPermission) {
            console.error('[NextAuth] Gmail send permission not granted');
            // Block sign-in if required Gmail permission not granted
            return '/auth/error?error=AccessDenied';
          }

          // Validate required tokens are present
          if (!account.access_token) {
            console.error('[NextAuth] No access token received from Google');
            return '/auth/error?error=Configuration';
          }

          if (!account.refresh_token) {
            console.warn('[NextAuth] No refresh token received (user may have already authorized)');
          }

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

          // Store Gmail OAuth tokens - this MUST succeed for sign-in to complete
          if (account.access_token && dbUser.id) {
            console.log('[NextAuth] Storing Gmail tokens for user:', user.email);

            try {
              await storeGmailTokens(
                dbUser.id,
                {
                  access_token: account.access_token,
                  refresh_token: account.refresh_token || undefined,
                  expiry_date: account.expires_at
                    ? account.expires_at * 1000
                    : undefined,
                },
                user.email
              );
              console.log('[NextAuth] Gmail tokens stored successfully');
            } catch (tokenError) {
              console.error('[NextAuth] CRITICAL: Failed to store Gmail tokens:', tokenError);
              console.error('[NextAuth] Token storage error details:', {
                message: tokenError instanceof Error ? tokenError.message : 'Unknown error',
                stack: tokenError instanceof Error ? tokenError.stack : undefined,
              });

              // If token storage fails, we MUST block sign-in
              // Otherwise user signs in but can't send emails
              return '/auth/error?error=Configuration';
            }
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

        try {
          // Add Gmail connection status to session
          const dbUser = await prisma.users.findUnique({
            where: { id: token.id as string },
            select: { gmailConnected: true, gmailEmail: true },
          });

          if (dbUser) {
            (session.user as { gmailConnected?: boolean; gmailEmail?: string | null }).gmailConnected = dbUser.gmailConnected;
            (session.user as { gmailConnected?: boolean; gmailEmail?: string | null }).gmailEmail = dbUser.gmailEmail;
            console.log('[NextAuth] Added Gmail status to session:', {
              connected: dbUser.gmailConnected,
              email: dbUser.gmailEmail,
            });
          }
        } catch (error) {
          console.error('[NextAuth] Failed to fetch Gmail status for session:', error);
        }
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
