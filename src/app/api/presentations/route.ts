export const dynamic = 'force-dynamic';
﻿import { NextResponse } from 'next/server';
import { jsonDb } from '@/lib/jsonDb';

export async function GET() {
  try {
    const presentations = jsonDb.getPresentations().sort((a, b) => b.updatedAt - a.updatedAt);
    return NextResponse.json({ presentations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch presentations' }, { status: 500 });
  }
}
