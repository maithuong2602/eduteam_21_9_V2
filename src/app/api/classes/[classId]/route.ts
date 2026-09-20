import { NextResponse } from 'next/server';
import { getExcelData } from '@/lib/excelDb';

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const data = getExcelData();
    const resolvedParams = await params;
    const students = data.students.filter((s: any) => s.classId === resolvedParams.classId);
    const classInfo = data.classes.find((c: any) => c.id === resolvedParams.classId);
    
    return NextResponse.json({ 
      class: classInfo,
      students 
    });
  } catch (error) {
    console.error('Error reading excel DB:', error);
    return NextResponse.json({ error: 'Failed to load students' }, { status: 500 });
  }
}
