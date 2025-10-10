import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/alerts/[id] - Update alert (pause/resume/edit)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, frequencyMinutes, frequencyLabel, title, notifyEmail, slackWebhook, discordWebhook } = body;

    const updateData: Record<string, unknown> = {};

    // Update status (pause/resume)
    if (status !== undefined) {
      updateData.status = status;

      // If resuming, calculate new nextCheckAt
      if (status === 'active') {
        const alert = await prisma.alerts.findUnique({ where: { id } });
        const freqMins = frequencyMinutes || alert?.frequencyMinutes || 60;
        updateData.nextCheckAt = new Date(Date.now() + freqMins * 60 * 1000);
      }
    }

    // Update check frequency
    if (frequencyMinutes !== undefined) {
      updateData.frequencyMinutes = frequencyMinutes;
      updateData.nextCheckAt = new Date(Date.now() + frequencyMinutes * 60 * 1000);
    }

    // Update frequency label
    if (frequencyLabel !== undefined) {
      updateData.frequencyLabel = frequencyLabel;
    }

    // Update other fields
    if (title !== undefined) updateData.title = title;
    if (notifyEmail !== undefined) updateData.notifyEmail = notifyEmail;
    if (slackWebhook !== undefined) updateData.slackWebhook = slackWebhook;
    if (discordWebhook !== undefined) updateData.discordWebhook = discordWebhook;

    const alert = await prisma.alerts.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

// DELETE /api/alerts/[id] - Delete alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.alerts.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}

// GET /api/alerts/[id] - Get single alert details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const alert = await prisma.alerts.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            changes: true,
            snapshots: true,
          },
        },
      },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert' },
      { status: 500 }
    );
  }
}
