import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';
import { sendAlertCreatedNotification } from '@/lib/email';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

// GET /api/alerts - List all alerts for authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Filter alerts by authenticated user
    const alerts = await prisma.alerts.findMany({
      where: { userId: user.id },
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      url,
      cssSelector,
      elementType,
      title,
      frequencyMinutes,
      frequencyLabel,
      notifyEmail,
    } = body;

    // Validate required fields
    if (!url || !cssSelector) {
      return NextResponse.json(
        { error: 'URL and CSS selector are required' },
        { status: 400 }
      );
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

    // Get user from session
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create alert for authenticated user
    const alert = await prisma.alerts.create({
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
        userId: user.id,
        updatedAt: now,
      },
    });

    // Take initial snapshot
    try {
      await takeSnapshot(alert.id, url, cssSelector);
    } catch (error) {
      console.error('Failed to take initial snapshot:', error);
    }

    // Send confirmation email to authenticated user
    if (notifyEmail) {
      try {
        await sendAlertCreatedNotification({
          alertId: alert.id,
          alertTitle: alert.title || `Monitor ${new URL(url).hostname}`,
          url,
          cssSelector,
          frequencyMinutes: validFrequency,
          frequencyLabel: frequencyLabel || `Every ${validFrequency} minutes`,
          userEmail: user.email,
          userId: user.id, // Pass userId for OAuth
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

      await prisma.snapshots.create({
        data: {
          id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
