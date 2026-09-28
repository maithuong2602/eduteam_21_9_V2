import { NextResponse } from 'next/server';
import { jsonDb } from '@/lib/jsonDb';

export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const resolvedParams = await params;
    const classId = decodeURIComponent(resolvedParams.classId).replace(/__slash__/g, '/');
    const { studentId, points, reason = 'Teacher manual update' } = await request.json();

    if (!studentId || typeof points !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    jsonDb.addLedger({
      ledgerId: 'LED_' + Date.now() + '_' + studentId,
      createdAt: Date.now(),
      classId,
      studentId,
      sessionCode: 'MANUAL',
      activityId: 'MANUAL',
      points,
      reason,
      type: points >= 0 ? 'BONUS' : 'PENALTY',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating bonus:', error);
    return NextResponse.json({ error: 'Failed to update bonus' }, { status: 500 });
  }
}
