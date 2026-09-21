import { NextResponse } from 'next/server';
import { jsonDb } from '@/lib/jsonDb';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    jsonDb.saveActivity({
      ...data,
      updatedAt: Date.now(),
      createdAt: data.createdAt || Date.now()
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
