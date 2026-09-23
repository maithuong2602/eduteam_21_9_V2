import { NextResponse } from 'next/server';
import { calculateCumulativeScore } from '@/lib/cumulativeScore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId') || undefined;
    const topicId = searchParams.get('topicId') || undefined;
    const lessonId = searchParams.get('lessonId') || undefined;

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 });
    }

    const results = calculateCumulativeScore({ classId, studentId, topicId, lessonId });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error calculating cumulative score:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
