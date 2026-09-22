export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { jsonDb } from '@/lib/jsonDb';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const p = jsonDb.getPresentation(resolvedParams.id);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const acts = jsonDb.getActivitiesByPresentation(resolvedParams.id);
    return NextResponse.json({ presentation: p, activities: acts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
