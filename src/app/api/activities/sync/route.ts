import { NextResponse } from 'next/server';
import { jsonDb } from '@/lib/jsonDb';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { presentationId, activities, slideActivities } = data;
    if (!presentationId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const allActs: any[] = [];
    Object.keys(slideActivities).forEach(slideId => {
      const actIds = slideActivities[slideId] || [];
      actIds.forEach((actId: string) => {
        const act = activities[actId];
        if (act) {
          allActs.push({
             ...act,
             presentationId,
             slideId: Number(slideId)
          });
        }
      });
    });

    // We can replace all activities for this presentation
    const db = jsonDb.getDb();
    db.activities = db.activities.filter(a => a.presentationId !== presentationId);
    db.activities.push(...allActs);
    jsonDb.saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
