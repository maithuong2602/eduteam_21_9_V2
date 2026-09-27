import { NextResponse } from 'next/server';
import { jsonDb } from '@/lib/jsonDb';

export async function GET() {
  try {
    const histories = jsonDb.getSessionHistories();
    return NextResponse.json({ success: true, histories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Authoritative check on student session scores
    if (Array.isArray(data.students)) {
      data.students = data.students.map((s: any) => {
        const actResults = Array.isArray(s.activityResults) ? s.activityResults : [];
        const sumActScores = actResults.reduce((acc: number, cur: any) => acc + (Number(cur.score) || 0), 0);
        return {
          ...s,
          sessionScore: Math.round(sumActScores * 10000) / 10000
        };
      });
    }

    jsonDb.saveSessionHistory({
      ...data,
      id: data.id || 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
