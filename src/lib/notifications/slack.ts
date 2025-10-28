/**
 * Slack Webhook Notification
 *
 * Sends change notifications to Slack channels via webhook URLs
 * Users configure webhook URLs in their alert settings
 */

import axios from 'axios';

export interface SlackNotificationOptions {
  webhookUrl: string;
  alertTitle: string;
  alertUrl: string;
  changeType: string;
  summary: string;
  dashboardUrl?: string;
}

/**
 * Send a notification to Slack when a change is detected
 */
export async function sendSlackNotification(
  options: SlackNotificationOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const { webhookUrl, alertTitle, alertUrl, changeType, summary, dashboardUrl } = options;

    // Slack message payload (Slack Block Kit format)
    const payload = {
      text: `🔔 Change Detected: ${alertTitle}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔔 Change Detected',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Alert:*\n${alertTitle}`,
            },
            {
              type: 'mrkdwn',
              text: `*Change Type:*\n${changeType}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Summary:*\n${summary}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Monitored Page:*\n<${alertUrl}|View Page>`,
          },
        },
        ...(dashboardUrl
          ? [
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'View in Dashboard',
                      emoji: true,
                    },
                    url: dashboardUrl,
                    style: 'primary',
                  },
                ],
              },
            ]
          : []),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `<!date^${Math.floor(Date.now() / 1000)}^Detected {date_short_pretty} at {time}|${new Date().toISOString()}>`,
            },
          ],
        },
      ],
    };

    // Send to Slack
    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Slack notification failed:', errorMsg);

    return {
      success: false,
      error: errorMsg,
    };
  }
}
