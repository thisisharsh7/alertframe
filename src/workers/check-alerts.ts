import cron from 'node-cron';
import axios from 'axios';

/**
 * Background worker for checking alerts
 * This runs the cron job locally during development
 * In production, Vercel Cron handles this automatically
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const CHECK_INTERVAL = process.env.CHECK_INTERVAL || '* * * * *'; // Default: every 1 minute (for testing)

console.log('🚀 Alert Worker Starting...');
console.log(`📍 API URL: ${API_URL}`);
console.log(`⏰ Check Interval: ${CHECK_INTERVAL}`);
console.log('─────────────────────────────────────────');

/**
 * Call the check-alerts endpoint
 */
async function checkAlerts() {
  const timestamp = new Date().toISOString();
  console.log(`\n⏰ [${timestamp}] Running alert check...`);

  try {
    const response = await axios.get(`${API_URL}/api/cron/check-alerts`, {
      timeout: 120000, // 2 minute timeout
      headers: {
        'User-Agent': 'AlertFrame-Worker/1.0',
        ...(process.env.CRON_SECRET && {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        })
      }
    });

    const data = response.data;

    if (data.success) {
      console.log('✅ Check completed successfully');
      console.log(`   📊 Alerts checked: ${data.summary.alertsChecked}`);
      console.log(`   🔔 Changes detected: ${data.summary.changesDetected}`);
      console.log(`   ❌ Errors: ${data.summary.errors}`);

      // Log details if there are changes or errors
      if (data.summary.changesDetected > 0 || data.summary.errors > 0) {
        console.log('\n   Details:');
        data.details.forEach((detail: any, index: number) => {
          const icon = detail.error ? '❌' : detail.changeDetected ? '🔔' : '✓';
          console.log(`   ${icon} ${index + 1}. ${detail.title || detail.alertId}`);
          if (detail.changeDetected) {
            console.log(`      └─ Change detected!`);
          }
          if (detail.error) {
            console.log(`      └─ Error: ${detail.error}`);
          }
        });
      }
    } else {
      console.error('❌ Check failed:', data.error);
      if (data.message) {
        console.error(`   Message: ${data.message}`);
      }
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to API server');
        console.error('   Make sure the dev server is running: npm run dev');
      } else if (error.response) {
        console.error('❌ API Error:', error.response.status, error.response.statusText);
        console.error('   Response:', error.response.data);
      } else if (error.request) {
        console.error('❌ No response from server');
        console.error('   Request timeout or network error');
      } else {
        console.error('❌ Request error:', error.message);
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }

  console.log('─────────────────────────────────────────');
}

/**
 * Schedule the cron job
 */
const task = cron.schedule(CHECK_INTERVAL, checkAlerts, {
  scheduled: true,
  timezone: process.env.TZ || 'UTC'
});

console.log('✅ Worker scheduled and ready');
console.log('💡 Waiting for next check...\n');

// Run immediately on startup for testing
setTimeout(() => {
  console.log('🔍 Running initial check...');
  checkAlerts();
}, 2000);

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down worker...');
  task.stop();
  console.log('✅ Worker stopped gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down worker...');
  task.stop();
  console.log('✅ Worker stopped gracefully');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Worker will continue running...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  console.error('Worker will continue running...');
});
