import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendors = await prisma.vendor.findMany({
      where: { deleted: false },
      select: {
        id: true,
        name: true,
        contact_name: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error('Get vendors error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}
