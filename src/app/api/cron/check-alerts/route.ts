import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { scrapeElement } from '@/lib/scraper';
import { detectChanges, formatDiffForEmail } from '@/lib/differ';
import { sendChangeNotification } from '@/lib/email';

/**
 * Cron endpoint to check all active alerts
 * Can be triggered manually or via Vercel Cron
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 CRON JOB STARTED - ${timestamp}`);
  console.log('='.repeat(60));

  try {
    // Optional: Add authorization for cron job (uncomment in production)
    if (process.env.CRON_SECRET) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error('❌ Unauthorized cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();

    // Find alerts that are due for checking
    const alertsDue = await prisma.alert.findMany({
      where: {
        status: 'active',
        OR: [
          { nextCheckAt: { lte: now } },
          { nextCheckAt: null },
        ],
      },
      include: {
        user: true,
        snapshots: {
          orderBy: { capturedAt: 'desc' },
          take: 1,
        },
      },
    });

    console.log(`📊 Found ${alertsDue.length} alerts due for checking`);

    if (alertsDue.length === 0) {
      console.log('✅ No alerts to check at this time');
      console.log('='.repeat(60) + '\n');
      return NextResponse.json({
        success: true,
        timestamp: now.toISOString(),
        summary: {
          alertsChecked: 0,
          changesDetected: 0,
          errors: 0,
        },
        details: [],
        duration: Date.now() - startTime,
      });
    }

    const results = {
      checked: 0,
      changes: 0,
      errors: 0,
      details: [] as any[],
    };

    // Process each alert
    for (const alert of alertsDue) {
      console.log(`\n┌─ Checking Alert: ${alert.title || alert.id}`);
      console.log(`│  URL: ${alert.url}`);
      console.log(`│  Selector: ${alert.cssSelector}`);

      try {
        const result = await checkAlert(alert);
        results.checked++;

        if (result.changeDetected) {
          results.changes++;
          console.log(`│  ✅ CHANGE DETECTED!`);
        } else {
          console.log(`│  ✓ No changes detected`);
        }

        results.details.push({
          alertId: alert.id,
          title: alert.title,
          changeDetected: result.changeDetected,
          error: result.error,
        });

        console.log(`└─ Completed\n`);

      } catch (error) {
        results.errors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`│  ❌ ERROR: ${errorMsg}`);
        console.log(`└─ Failed\n`);

        results.details.push({
          alertId: alert.id,
          title: alert.title,
          error: errorMsg,
        });

        // Update alert with error status
        const frequencyMinutes = alert.frequencyMinutes || 60; // Default to 1 hour
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            lastCheckedAt: now,
            nextCheckAt: new Date(now.getTime() + frequencyMinutes * 60 * 1000),
          },
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log('\n' + '='.repeat(60));
    console.log('📊 CRON JOB SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Alerts checked: ${results.checked}`);
    console.log(`🔔 Changes detected: ${results.changes}`);
    console.log(`❌ Errors: ${results.errors}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log('='.repeat(60) + '\n');

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        alertsChecked: results.checked,
        changesDetected: results.changes,
        errors: results.errors,
      },
      details: results.details,
      duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    console.error('\n' + '='.repeat(60));
    console.error('💥 CRON JOB FAILED');
    console.error('='.repeat(60));
    console.error('Error:', errorMsg);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error(`Duration: ${duration}ms`);
    console.error('='.repeat(60) + '\n');

    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        message: errorMsg,
        duration,
      },
      { status: 500 }
    );
  }
}

/**
 * Check a single alert for changes
 */
async function checkAlert(alert: any): Promise<{
  changeDetected: boolean;
  error?: string;
}> {
  const now = new Date();

  // Scrape the current state
  const scrapeResult = await scrapeElement(alert.url, alert.cssSelector);

  if (!scrapeResult.success) {
    throw new Error(scrapeResult.error || 'Failed to scrape element');
  }

  // Get the latest snapshot
  const latestSnapshot = alert.snapshots[0];

  // Create new snapshot
  const newSnapshot = await prisma.snapshot.create({
    data: {
      alertId: alert.id,
      htmlContent: scrapeResult.htmlContent,
      textContent: scrapeResult.textContent,
      itemCount: scrapeResult.itemCount,
    },
  });

  // Get frequency in minutes (use new field, fallback to old)
  const frequencyMinutes = alert.frequencyMinutes || (alert.checkFrequency ? alert.checkFrequency * 60 : 1);

  if (frequencyMinutes <= 0) {
    console.warn(`│  ⚠️  Invalid frequency, using 1 minute default`);
  }

  // Calculate next check time (add minutes to current time)
  const nextCheckAt = new Date(now.getTime() + Math.max(frequencyMinutes, 1) * 60 * 1000);

  console.log(`│  ⏰ Next check in ${frequencyMinutes} minutes: ${nextCheckAt.toLocaleString()}`);

  // Update alert
  await prisma.alert.update({
    where: { id: alert.id },
    data: {
      lastCheckedAt: now,
      nextCheckAt,
      status: 'active',
      errorMessage: null,
    },
  });

  // If no previous snapshot, this is the first check
  if (!latestSnapshot) {
    console.log(`│  ℹ️  First check - baseline snapshot created`);
    return { changeDetected: false };
  }

  console.log(`│  🔍 Comparing with previous snapshot...`);

  // Detect changes
  const changeResult = detectChanges(
    {
      htmlContent: latestSnapshot.htmlContent,
      textContent: latestSnapshot.textContent || '',
      itemCount: latestSnapshot.itemCount,
    },
    {
      htmlContent: scrapeResult.htmlContent,
      textContent: scrapeResult.textContent,
      itemCount: scrapeResult.itemCount,
    }
  );

  if (changeResult.hasChanged && changeResult.changeType) {
    console.log(`│  📝 ${changeResult.summary}`);

    // Create change record
    await prisma.change.create({
      data: {
        alertId: alert.id,
        changeType: changeResult.changeType,
        summary: changeResult.summary || 'Changes detected',
        diffData: changeResult.diffData,
      },
    });

    // Send email notification if enabled
    if (alert.notifyEmail && alert.user?.email) {
      console.log(`│  📧 Sending email to ${alert.user.email}...`);
      try {
        const diffHtml = formatDiffForEmail(changeResult.diffData);

        const emailSent = await sendChangeNotification({
          alertId: alert.id,
          alertTitle: alert.title || `Monitor ${new URL(alert.url).hostname}`,
          url: alert.url,
          changeType: changeResult.changeType,
          summary: changeResult.summary || 'Changes detected',
          diffHtml,
          userEmail: alert.user.email,
        });

        if (emailSent) {
          // Mark change as notified
          const change = await prisma.change.findFirst({
            where: { alertId: alert.id },
            orderBy: { detectedAt: 'desc' },
          });

          if (change) {
            await prisma.change.update({
              where: { id: change.id },
              data: {
                notified: true,
                notifiedAt: new Date(),
              },
            });
          }

          console.log(`│  ✅ Email notification sent successfully`);
        } else {
          console.log(`│  ⚠️  Email notification skipped (no API key configured)`);
        }
      } catch (emailError) {
        const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`│  ❌ Email failed: ${errorMsg}`);
      }
    } else if (!alert.notifyEmail) {
      console.log(`│  ℹ️  Email notifications disabled for this alert`);
    } else {
      console.log(`│  ⚠️  No email configured for this alert`);
    }

    return { changeDetected: true };
  }

  return { changeDetected: false };
}
