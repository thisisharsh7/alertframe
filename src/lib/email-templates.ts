/**
 * Generate HTML for change detection email
 */
export function generateChangeEmailHtml(data: {
  alertTitle: string;
  url: string;
  changeType: 'added' | 'removed' | 'modified';
  summary: string;
  diffHtml: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #ffffff;
          }
          .container {
            border: 1px solid #e0e0e0;
            margin: 20px;
          }
          .header {
            background: #ffffff;
            border-bottom: 3px solid #000000;
            padding: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #000000;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 8px 0 0 0;
            font-size: 14px;
            color: #666666;
          }
          .content {
            padding: 30px;
            background: #ffffff;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: #fafafa;
            border: 1px solid #e0e0e0;
          }
          .info-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 14px;
          }
          .info-table td:first-child {
            font-weight: 600;
            color: #666666;
            width: 120px;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          .info-table td:last-child {
            color: #1a1a1a;
          }
          .info-table tr:last-child td {
            border-bottom: none;
          }
          .info-table a {
            color: #1a1a1a;
            text-decoration: underline;
          }
          .section {
            margin: 25px 0;
          }
          .section-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666666;
            margin-bottom: 10px;
          }
          .summary-box {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 15px;
            font-size: 14px;
            line-height: 1.6;
            color: #1a1a1a;
          }
          .changes-box {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 15px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            overflow-x: auto;
            line-height: 1.8;
          }
          .changes-box del {
            background: #f5f5f5;
            text-decoration: line-through;
            color: #666666;
          }
          .changes-box ins {
            background: #f5f5f5;
            text-decoration: none;
            font-weight: 600;
            color: #000000;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #000000;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
            border: 2px solid #000000;
          }
          .button:hover {
            background: #ffffff;
            color: #000000 !important;
          }
          .footer {
            background: #fafafa;
            border-top: 1px solid #e0e0e0;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #666666;
            line-height: 1.6;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Change Detected</h1>
            <p>Alert notification from AlertFrame</p>
          </div>

          <div class="content">
            <table class="info-table">
              <tr>
                <td>Alert</td>
                <td><strong>${data.alertTitle}</strong></td>
              </tr>
              <tr>
                <td>URL</td>
                <td><a href="${data.url}">${data.url}</a></td>
              </tr>
              <tr>
                <td>Change Type</td>
                <td><strong>${data.changeType.toUpperCase()}</strong></td>
              </tr>
              <tr>
                <td>Detected</td>
                <td>${new Date().toUTCString()}</td>
              </tr>
            </table>

            <div class="section">
              <div class="section-title">Summary</div>
              <div class="summary-box">
                ${data.summary}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Changes Detected</div>
              <div class="changes-box">
                ${data.diffHtml}
              </div>
            </div>

            <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" class="button">
              View in Dashboard
            </a>
          </div>

          <div class="footer">
            <p>You're receiving this because you set up monitoring for this page.</p>
            <p><strong>AlertFrame</strong> · Website Change Monitoring</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for alert created confirmation email
 */
export function generateConfirmationEmailHtml(data: {
  alertTitle: string;
  url: string;
  cssSelector: string;
  frequencyLabel: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #ffffff;
          }
          .container {
            border: 1px solid #e0e0e0;
            margin: 20px;
          }
          .header {
            background: #ffffff;
            border-bottom: 3px solid #000000;
            padding: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #000000;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 8px 0 0 0;
            font-size: 14px;
            color: #666666;
          }
          .content {
            padding: 30px;
            background: #ffffff;
          }
          .status-box {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 20px;
            margin-bottom: 25px;
          }
          .status-box p {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: #1a1a1a;
          }
          .status-box strong {
            display: block;
            margin-bottom: 5px;
            font-weight: 700;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: #fafafa;
            border: 1px solid #e0e0e0;
          }
          .info-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 14px;
          }
          .info-table td:first-child {
            font-weight: 600;
            color: #666666;
            width: 140px;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          .info-table td:last-child {
            color: #1a1a1a;
            word-break: break-all;
          }
          .info-table tr:last-child td {
            border-bottom: none;
          }
          .info-table a {
            color: #1a1a1a;
            text-decoration: underline;
          }
          .info-table code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            background: #f5f5f5;
            padding: 2px 6px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #000000;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
            border: 2px solid #000000;
          }
          .button:hover {
            background: #ffffff;
            color: #000000 !important;
          }
          .footer {
            background: #fafafa;
            border-top: 1px solid #e0e0e0;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #666666;
            line-height: 1.6;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Alert Created Successfully</h1>
            <p>Confirmation from AlertFrame</p>
          </div>

          <div class="content">
            <div class="status-box">
              <strong>Your alert is now active</strong>
              <p>We will monitor the page and notify you when changes are detected.</p>
            </div>

            <table class="info-table">
              <tr>
                <td>Alert Name</td>
                <td><strong>${data.alertTitle}</strong></td>
              </tr>
              <tr>
                <td>URL</td>
                <td><a href="${data.url}">${data.url}</a></td>
              </tr>
              <tr>
                <td>Monitoring</td>
                <td><code>${data.cssSelector}</code></td>
              </tr>
              <tr>
                <td>Check Frequency</td>
                <td>${data.frequencyLabel}</td>
              </tr>
              <tr>
                <td>Notifications</td>
                <td>You will receive email notifications when changes are detected</td>
              </tr>
            </table>

            <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" class="button">
              View Dashboard
            </a>
          </div>

          <div class="footer">
            <p><strong>What happens next?</strong></p>
            <p>We will check your selected element ${data.frequencyLabel.toLowerCase()} and alert you when changes are detected.</p>
            <p style="margin-top: 15px;"><strong>AlertFrame</strong> · Website Change Monitoring</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
