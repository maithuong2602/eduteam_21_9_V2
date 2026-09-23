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
    jsonDb.saveSessionHistory({
      ...data,
      id: data.id || 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
