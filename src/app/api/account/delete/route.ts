import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * DELETE Account API Route
 *
 * Permanently deletes user account and all associated data
 * This includes: alerts, changes, snapshots, sessions, and OAuth accounts
 */
export async function DELETE() {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    console.log('[Delete Account] Starting deletion for user:', userId);

    // Delete all user data - cascade should handle related records
    // but we'll be explicit for important ones
    await prisma.$transaction(async (tx) => {
      // Delete user's alerts (this cascades to changes and snapshots)
      const deletedAlerts = await tx.alerts.deleteMany({
        where: { userId },
      });
      console.log('[Delete Account] Deleted alerts:', deletedAlerts.count);

      // Delete user's sessions
      const deletedSessions = await tx.sessions.deleteMany({
        where: { userId },
      });
      console.log('[Delete Account] Deleted sessions:', deletedSessions.count);

      // Delete user's OAuth accounts
      const deletedAccounts = await tx.accounts.deleteMany({
        where: { userId },
      });
      console.log('[Delete Account] Deleted accounts:', deletedAccounts.count);

      // Finally, delete the user record
      await tx.users.delete({
        where: { id: userId },
      });
      console.log('[Delete Account] Deleted user record:', userId);
    });

    console.log('[Delete Account] Successfully deleted all data for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('[Delete Account] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
