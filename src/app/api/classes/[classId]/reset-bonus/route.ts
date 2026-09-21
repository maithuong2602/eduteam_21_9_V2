import { NextResponse } from 'next/server';
import { jsonDb } from '@/lib/jsonDb';

export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const resolvedParams = await params;
    const classId = resolvedParams.classId;
    if (!classId) return NextResponse.json({ error: 'Missing classId' }, { status: 400 });

    jsonDb.resetBonusForClass(classId, 'teacher_1');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
