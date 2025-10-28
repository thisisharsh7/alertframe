/**
 * Discord Webhook Notification
 *
 * Sends change notifications to Discord channels via webhook URLs
 * Users configure webhook URLs in their alert settings
 */

import axios from 'axios';

export interface DiscordNotificationOptions {
  webhookUrl: string;
  alertTitle: string;
  alertUrl: string;
  changeType: string;
  summary: string;
  dashboardUrl?: string;
}

/**
 * Send a notification to Discord when a change is detected
 */
export async function sendDiscordNotification(
  options: DiscordNotificationOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const { webhookUrl, alertTitle, alertUrl, changeType, summary, dashboardUrl } = options;

    // Discord embed color based on change type
    const getColor = (type: string): number => {
      switch (type.toLowerCase()) {
        case 'added':
          return 0x00ff00; // Green
        case 'removed':
          return 0xff0000; // Red
        case 'modified':
          return 0xffa500; // Orange
        default:
          return 0x0099ff; // Blue
      }
    };

    // Discord message payload
    const payload = {
      content: '🔔 **Change Detected**',
      embeds: [
        {
          title: alertTitle,
          url: alertUrl,
          description: summary,
          color: getColor(changeType),
          fields: [
            {
              name: '📊 Change Type',
              value: changeType,
              inline: true,
            },
            {
              name: '🔗 Monitored Page',
              value: `[View Page](${alertUrl})`,
              inline: true,
            },
            ...(dashboardUrl
              ? [
                  {
                    name: '📱 Dashboard',
                    value: `[View in Dashboard](${dashboardUrl})`,
                    inline: true,
                  },
                ]
              : []),
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'AlertFrame',
          },
        },
      ],
    };

    // Send to Discord
    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Discord notification failed:', errorMsg);

    return {
      success: false,
      error: errorMsg,
    };
  }
}
