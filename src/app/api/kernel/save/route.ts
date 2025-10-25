import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

/**
 * Save user's OnKernel API key
 * POST /api/kernel/save
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the API key from request body
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Validate API key format (OnKernel keys start with 'sk_')
    if (!apiKey.startsWith('sk_')) {
      return NextResponse.json(
        { error: 'Invalid OnKernel API key format. Keys should start with "sk_"' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Encrypt the API key before storing
    const encryptedKey = encrypt(apiKey);

    // Update user with encrypted API key
    await prisma.users.update({
      where: { id: user.id },
      data: {
        kernelApiKey: encryptedKey,
        updatedAt: new Date(),
      },
    });

    console.log(`[Kernel API] User ${user.email} saved OnKernel API key`);

    return NextResponse.json({
      success: true,
      message: 'OnKernel API key saved successfully',
    });
  } catch (error) {
    console.error('Error saving OnKernel API key:', error);
    return NextResponse.json(
      {
        error: 'Failed to save API key',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Check if user has saved an OnKernel API key
 * GET /api/kernel/save
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { kernelApiKey: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      hasKey: !!user.kernelApiKey,
    });
  } catch (error) {
    console.error('Error checking OnKernel API key:', error);
    return NextResponse.json(
      {
        error: 'Failed to check API key',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Delete user's OnKernel API key
 * DELETE /api/kernel/save
 */
export async function DELETE() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove API key
    await prisma.users.update({
      where: { id: user.id },
      data: {
        kernelApiKey: null,
        updatedAt: new Date(),
      },
    });

    console.log(`[Kernel API] User ${user.email} deleted OnKernel API key`);

    return NextResponse.json({
      success: true,
      message: 'OnKernel API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting OnKernel API key:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete API key',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
