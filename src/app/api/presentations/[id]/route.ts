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


export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const p = jsonDb.getPresentation(resolvedParams.id);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    if (body.title) p.title = body.title;
    p.updatedAt = Date.now();
    
    jsonDb.savePresentation(p);
    return NextResponse.json({ success: true, presentation: p });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const p = jsonDb.getPresentation(resolvedParams.id);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    jsonDb.deletePresentation(resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
