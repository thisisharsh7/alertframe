import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';
import { sendAlertCreatedNotification } from '@/lib/email';

// GET /api/alerts - List all alerts
export async function GET(request: NextRequest) {
  try {
    // In production, this would be filtered by authenticated user
    const alerts = await prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            changes: true,
          },
        },
      },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

// POST /api/alerts - Create new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      cssSelector,
      elementType,
      title,
      frequencyMinutes,
      frequencyLabel,
      notifyEmail,
      email,
    } = body;

    // Validate required fields
    if (!url || !cssSelector) {
      return NextResponse.json(
        { error: 'URL and CSS selector are required' },
        { status: 400 }
      );
    }

    // Validate email if notifications are enabled
    if (notifyEmail && email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        );
      }
    }

    // Validate frequency
    const frequencyNum = parseInt(frequencyMinutes);
    if (isNaN(frequencyNum) || frequencyNum <= 0) {
      return NextResponse.json(
        { error: 'Check frequency must be a positive number (in minutes)' },
        { status: 400 }
      );
    }

    // Minimum frequency: 1 minute
    const validFrequency = Math.max(frequencyNum, 1);

    // Calculate next check time (add minutes to current time)
    const now = new Date();
    const nextCheckAt = new Date(now.getTime() + validFrequency * 60 * 1000);

    // Create alert (without user for MVP - in production this would require auth)
    const alert = await prisma.alert.create({
      data: {
        id: nanoid(),
        url,
        cssSelector,
        elementType: elementType || 'single',
        title: title || `Monitor ${new URL(url).hostname}`,
        frequencyMinutes: validFrequency,
        frequencyLabel: frequencyLabel || `Every ${validFrequency} minutes`,
        nextCheckAt,
        notifyEmail: notifyEmail ?? true,
        status: 'active',
        // In production: userId would come from session
        user: {
          connectOrCreate: {
            where: { email: email || 'demo@alertframe.com' },
            create: {
              email: email || 'demo@alertframe.com',
              name: 'Demo User',
            },
          },
        },
      },
    });

    // Take initial snapshot
    try {
      await takeSnapshot(alert.id, url, cssSelector);
    } catch (error) {
      console.error('Failed to take initial snapshot:', error);
    }

    // Send confirmation email
    if (notifyEmail && (email || alert.user?.email)) {
      try {
        await sendAlertCreatedNotification({
          alertId: alert.id,
          alertTitle: alert.title || `Monitor ${new URL(url).hostname}`,
          url,
          cssSelector,
          frequencyMinutes: validFrequency,
          frequencyLabel: frequencyLabel || `Every ${validFrequency} minutes`,
          userEmail: email || alert.user.email,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      id: alert.id,
      alert
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to take initial snapshot
async function takeSnapshot(alertId: string, url: string, cssSelector: string) {
  const puppeteer = require('puppeteer');
  const cheerio = require('cheerio');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    const html = await page.content();
    await browser.close();

    // Extract the selected element
    const $ = cheerio.load(html);
    const element = $(cssSelector);

    if (element.length > 0) {
      const htmlContent = element.html() || '';
      const textContent = element.text() || '';
      const itemCount = element.children().length > 2 ? element.children().length : null;

      await prisma.snapshot.create({
        data: {
          alertId,
          htmlContent,
          textContent,
          itemCount,
        },
      });
    }
  } catch (error) {
    console.error('Snapshot error:', error);
    await browser.close();
    throw error;
  }
}
