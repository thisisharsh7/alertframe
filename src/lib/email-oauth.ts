import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * Gmail OAuth Email Sender
 *
 * Sends emails using user's Gmail account via OAuth 2.0
 * Each user sends from their own Gmail (500 emails/day per user)
 */

interface GmailTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

/**
 * Get Gmail OAuth2 client for a user
 */
async function getGmailClient(userId: string) {
  console.log('[Gmail OAuth] Getting client for user:', userId);

  // Using lowercase 'users' table name from Prisma schema
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      gmailAccessToken: true,
      gmailRefreshToken: true,
      gmailTokenExpiry: true,
      gmailConnected: true,
      gmailEmail: true,
    },
  });

  if (!user || !user.gmailConnected) {
    console.error('[Gmail OAuth] Gmail not connected for user:', userId);
    throw new Error('Gmail not connected for this user');
  }

  if (!user.gmailAccessToken || !user.gmailRefreshToken) {
    console.error('[Gmail OAuth] Gmail tokens missing for user:', userId);
    throw new Error('Gmail tokens missing for this user');
  }

  console.log('[Gmail OAuth] Token expiry:', {
    expiry: user.gmailTokenExpiry?.toISOString(),
    now: new Date().toISOString(),
    isExpired: user.gmailTokenExpiry ? user.gmailTokenExpiry.getTime() < Date.now() : 'unknown'
  });

  // Decrypt tokens
  const accessToken = decrypt(user.gmailAccessToken);
  const refreshToken = decrypt(user.gmailRefreshToken);

  console.log('[Gmail OAuth] Tokens decrypted:', {
    accessTokenLength: accessToken.length,
    accessTokenStart: accessToken.substring(0, 10) + '...',
    refreshTokenLength: refreshToken.length,
    refreshTokenStart: refreshToken.substring(0, 10) + '...',
  });

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: user.gmailTokenExpiry?.getTime(),
  });

  // Check if token needs refresh
  const now = Date.now();
  const expiryTime = user.gmailTokenExpiry?.getTime() || 0;
  const needsRefresh = expiryTime <= now + 5 * 60 * 1000;

  console.log('[Gmail OAuth] Token refresh check:', {
    expiryTime: new Date(expiryTime).toISOString(),
    now: new Date(now).toISOString(),
    expiresInMinutes: Math.round((expiryTime - now) / (60 * 1000)),
    needsRefresh
  });

  if (needsRefresh) {
    console.log('[Gmail OAuth] Refreshing access token...');
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log('[Gmail OAuth] Token refreshed successfully:', {
        hasNewAccessToken: !!credentials.access_token,
        hasNewRefreshToken: !!credentials.refresh_token,
        newExpiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'none'
      });

      if (credentials.access_token) {
        // Update database with new tokens
        await prisma.users.update({
          where: { id: userId },
          data: {
            gmailAccessToken: encrypt(credentials.access_token),
            gmailTokenExpiry: credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : null,
          },
        });

        // Update the client
        oauth2Client.setCredentials(credentials);
        console.log('[Gmail OAuth] Database updated with new token');
      }
    } catch (error) {
      console.error('[Gmail OAuth] Failed to refresh Gmail token:', error);
      console.error('[Gmail OAuth] Refresh error details:', {
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error('Failed to refresh Gmail access token');
    }
  } else {
    console.log('[Gmail OAuth] Token is still valid, no refresh needed');
  }

  return { oauth2Client, userEmail: user.gmailEmail };
}

/**
 * Send email using Gmail OAuth
 */
export async function sendEmailViaGmail(params: {
  userId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const { userId, to, subject, html, text } = params;

  console.log('[Gmail OAuth] Sending email:', {
    userId,
    to,
    subject
  });

  try {
    // Get OAuth client for user
    const { oauth2Client, userEmail } = await getGmailClient(userId);

    if (!userEmail) {
      throw new Error('User Gmail email not found');
    }

    console.log('[Gmail OAuth] Using Gmail API to send email:', {
      userEmail,
      hasAccessToken: !!oauth2Client.credentials.access_token,
      hasRefreshToken: !!oauth2Client.credentials.refresh_token,
    });

    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email in RFC 2822 format
    const emailLines = [
      `From: ${userEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html
    ];

    const email = emailLines.join('\r\n');

    // Encode email in base64url format
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('[Gmail OAuth] Sending via Gmail API...');

    // Send email using Gmail API
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log('[Gmail OAuth] ✅ Email sent successfully:', {
      messageId: result.data.id,
      to,
      from: userEmail
    });
  } catch (error) {
    console.error('[Gmail OAuth] ❌ Failed to send email via Gmail:', {
      error: error instanceof Error ? error.message : error,
      errorName: error instanceof Error ? error.name : undefined,
      errorCode: (error as any)?.code,
      errorStack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if user has Gmail connected
 */
export async function isGmailConnected(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { gmailConnected: true },
  });

  return user?.gmailConnected || false;
}

/**
 * Store Gmail OAuth tokens for a user
 */
export async function storeGmailTokens(
  userId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  },
  userEmail: string
): Promise<void> {
  console.log('[email-oauth] Storing Gmail tokens for user:', { userId, userEmail, hasRefreshToken: !!tokens.refresh_token });

  const encryptedAccessToken = encrypt(tokens.access_token);
  const encryptedRefreshToken = tokens.refresh_token
    ? encrypt(tokens.refresh_token)
    : undefined;

  try {
    await prisma.users.update({
      where: { id: userId },
      data: {
        gmailAccessToken: encryptedAccessToken,
        gmailRefreshToken: encryptedRefreshToken,
        gmailTokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        gmailConnected: true,
        gmailEmail: userEmail,
      },
    });
    console.log('[email-oauth] Successfully stored Gmail tokens for user:', userEmail);
  } catch (error) {
    console.error('[email-oauth] Failed to store Gmail tokens:', error);
    throw error;
  }
}

/**
 * Disconnect Gmail for a user
 */
export async function disconnectGmail(userId: string): Promise<void> {
  await prisma.users.update({
    where: { id: userId },
    data: {
      gmailAccessToken: null,
      gmailRefreshToken: null,
      gmailTokenExpiry: null,
      gmailConnected: false,
      gmailEmail: null,
    },
  });
}

/**
 * Strip HTML tags from text (simple fallback)
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
