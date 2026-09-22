import { NextResponse } from 'next/server';
import { jsonDb } from '@/lib/jsonDb';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { action, slideNumber, fileUrl, totalPages } = body;
    
    const p = jsonDb.getPresentation(resolvedParams.id);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!p.slides) return NextResponse.json({ error: 'No slides array' }, { status: 500 });
    
    const activities = jsonDb.getActivitiesByPresentation(resolvedParams.id);

    if (action === 'DELETE') {
      const index = slideNumber - 1;
      if (index < 0 || index >= p.slides.length) return NextResponse.json({ error: 'Invalid slideNumber' }, { status: 400 });
      
      p.slides.splice(index, 1);
      p.totalSlides = p.slides.length;
      jsonDb.savePresentation(p);
      
      activities.forEach(act => {
        if (act.slideId === slideNumber) {
           jsonDb.deleteActivity(act.id);
        } else if (act.slideId > slideNumber) {
           act.slideId -= 1;
           jsonDb.saveActivity(act);
        }
      });
      
      return NextResponse.json({ success: true, presentation: p });
    }
    
    if (action === 'INSERT_AFTER') {
      const index = slideNumber;
      if (index < 0 || index > p.slides.length) return NextResponse.json({ error: 'Invalid slideNumber' }, { status: 400 });
      
      const newSlides = Array.from({ length: totalPages }).map((_, i) => ({
        id: "slide_" + Date.now() + "_" + i,
        fileUrl: fileUrl,
        pageNumber: i + 1
      }));
      
      p.slides.splice(index, 0, ...newSlides);
      p.totalSlides = p.slides.length;
      jsonDb.savePresentation(p);
      
      activities.forEach(act => {
        if (act.slideId > slideNumber) {
           act.slideId += totalPages;
           jsonDb.saveActivity(act);
        }
      });
      
      return NextResponse.json({ success: true, presentation: p });
    }
    
    if (action === 'REPLACE') {
       const index = slideNumber - 1;
       if (index < 0 || index >= p.slides.length) return NextResponse.json({ error: 'Invalid slideNumber' }, { status: 400 });
       
       const newSlides = Array.from({ length: totalPages }).map((_, i) => ({
        id: "slide_" + Date.now() + "_" + i,
        fileUrl: fileUrl,
        pageNumber: i + 1
      }));
      
      p.slides.splice(index, 1, ...newSlides);
      p.totalSlides = p.slides.length;
      jsonDb.savePresentation(p);
      
      const diff = totalPages - 1;
      if (diff !== 0) {
         activities.forEach(act => {
           if (act.slideId > slideNumber) {
              act.slideId += diff;
              jsonDb.saveActivity(act);
           }
         });
      }
      return NextResponse.json({ success: true, presentation: p });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}