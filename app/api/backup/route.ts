import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildBackup } from '@/lib/backup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const backup = await buildBackup(prisma);
    const fileDate = backup.created_at.slice(0, 10);

    return new NextResponse(JSON.stringify(backup), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="procurvin-backup-${fileDate}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    // Never log backup contents.
    console.error('Backup export failed:', error);
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 });
  }
}
