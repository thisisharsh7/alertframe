import { Resend } from 'resend';
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
  userId?: string; // Keep for future use
}

/**
 * Send email notification when a change is detected
 * Uses Resend API to send from AlertFrame domain
 */
export async function sendChangeNotification(data: EmailNotificationData): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured');
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
      console.error('  Response:', (error as { response?: unknown }).response);
    }
    return false;
  }
}

/**
 * Send confirmation email when alert is created
 * Uses Resend API to send from AlertFrame domain
 */
export async function sendAlertCreatedNotification(data: {
  alertId: string;
  alertTitle: string;
  url: string;
  cssSelector: string;
  frequencyMinutes: number;
  frequencyLabel: string;
  userEmail: string;
  userId?: string; // Keep for future use
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const emailHtml = generateConfirmationEmailHtml({
      alertTitle: data.alertTitle,
      url: data.url,
      cssSelector: data.cssSelector,
      frequencyLabel: data.frequencyLabel,
    });

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
