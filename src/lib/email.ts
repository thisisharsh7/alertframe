import { Resend } from 'resend';
import { sendEmailViaGmail, isGmailConnected } from './email-oauth';
import { generateChangeEmailHtml, generateConfirmationEmailHtml } from './email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailNotificationData {
  alertId: string;
  alertTitle: string;
  url: string;
  changeType: 'added' | 'removed' | 'modified';
  summary: string;
  diffHtml: string;
  userEmail: string;
  userId?: string; // Optional userId for OAuth
}

/**
 * Send email notification when a change is detected
 */
export async function sendChangeNotification(data: EmailNotificationData): Promise<boolean> {
  // Try Gmail OAuth first if userId is provided
  if (data.userId) {
    try {
      const hasGmail = await isGmailConnected(data.userId);
      if (hasGmail) {
        const emailHtml = generateChangeEmailHtml({
          alertTitle: data.alertTitle,
          url: data.url,
          changeType: data.changeType,
          summary: data.summary,
          diffHtml: data.diffHtml,
        });

        await sendEmailViaGmail({
          userId: data.userId,
          to: data.userEmail,
          subject: `Change Detected: ${data.alertTitle}`,
          html: emailHtml,
        });

        console.log('📧 Email sent successfully via Gmail OAuth:', {
          to: data.userEmail,
          method: 'Gmail OAuth',
        });

        return true;
      }
    } catch (error) {
      console.warn('Failed to send via Gmail OAuth, falling back to Resend:', error);
      // Fall through to Resend
    }
  }

  // Fallback to Resend
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured and Gmail OAuth not available');
    return false;
  }

  try {
    const emailHtml = generateChangeEmailHtml({
      alertTitle: data.alertTitle,
      url: data.url,
      changeType: data.changeType,
      summary: data.summary,
      diffHtml: data.diffHtml,
    });

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'AlertFrame <alerts@alertframe.com>',
      to: data.userEmail,
      subject: `Change Detected: ${data.alertTitle}`,
      html: emailHtml,
    });

    console.log('📧 Email sent successfully via Resend:', {
      emailId: result.data?.id,
      to: data.userEmail,
      from: process.env.EMAIL_FROM,
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to send email notification:');
    console.error('  Error:', error instanceof Error ? error.message : error);
    console.error('  To:', data.userEmail);
    console.error('  From:', process.env.EMAIL_FROM);
    if (error instanceof Error && 'response' in error) {
      console.error('  Response:', (error as any).response);
    }
    return false;
  }
}

/**
 * Send confirmation email when alert is created
 */
export async function sendAlertCreatedNotification(data: {
  alertId: string;
  alertTitle: string;
  url: string;
  cssSelector: string;
  frequencyMinutes: number;
  frequencyLabel: string;
  userEmail: string;
  userId?: string; // Optional userId for OAuth
}): Promise<boolean> {
  // Try Gmail OAuth first if userId is provided
  if (data.userId) {
    try {
      const hasGmail = await isGmailConnected(data.userId);
      if (hasGmail) {
        const emailHtml = generateConfirmationEmailHtml({
          alertTitle: data.alertTitle,
          url: data.url,
          cssSelector: data.cssSelector,
          frequencyLabel: data.frequencyLabel,
        });

        await sendEmailViaGmail({
          userId: data.userId,
          to: data.userEmail,
          subject: `Alert Created: ${data.alertTitle}`,
          html: emailHtml,
        });

        console.log('📧 Confirmation email sent successfully via Gmail OAuth:', {
          to: data.userEmail,
          method: 'Gmail OAuth',
        });

        return true;
      }
    } catch (error) {
      console.warn('Failed to send confirmation via Gmail OAuth, falling back to Resend:', error);
      // Fall through to Resend
    }
  }

  // Fallback to Resend
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured and Gmail OAuth not available');
    return false;
  }

  try {
    const emailHtml = generateConfirmationEmailHtml(data);

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'AlertFrame <alerts@alertframe.com>',
      to: data.userEmail,
      subject: `Alert Created: ${data.alertTitle}`,
      html: emailHtml,
    });

    console.log('📧 Confirmation email sent successfully via Resend:', {
      emailId: result.data?.id,
      to: data.userEmail,
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to send confirmation email:');
    console.error('  Error:', error instanceof Error ? error.message : error);
    console.error('  To:', data.userEmail);
    return false;
  }
}
