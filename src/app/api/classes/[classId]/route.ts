import { NextResponse } from 'next/server';
import { getExcelData } from '@/lib/excelDb';
import { jsonDb } from '@/lib/jsonDb';

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const data = getExcelData();
    const resolvedParams = await params;
    const classId = resolvedParams.classId;

    let students = data.students.filter((s: any) => s.classId === classId);
    let classInfo = data.classes.find((c: any) => c.id === classId);

    const ledgers = jsonDb.getLedgersByClass(classId);
    const resetLedgers = ledgers.filter(l => l.type === 'RESET');
    const latestResetTime = resetLedgers.length > 0 ? Math.max(...resetLedgers.map(l => l.createdAt)) : 0;
    const activeLedgers = ledgers.filter(l => l.createdAt >= latestResetTime && l.type !== 'RESET');
    
    let totalClassBonus = 0;
    
    // Calculate per-student bonus
    students = students.map((s: any) => {
      const studentLedgers = activeLedgers.filter(l => l.studentId === s.id || l.studentId === 'ALL');
      const bonusPoints = studentLedgers.reduce((sum, l) => sum + (l.points || 0), 0);
      totalClassBonus += bonusPoints;
      return { ...s, bonusPoints };
    });

    if (classInfo) {
      classInfo = {
        ...classInfo,
        code: jsonDb.getClassCode(classId),
        cumulativeBonus: totalClassBonus
      };
    }
    
    return NextResponse.json({ 
      class: classInfo,
      students 
    });
  } catch (error) {
    console.error('Error reading excel DB:', error);
    return NextResponse.json({ error: 'Failed to load students' }, { status: 500 });
  }
}
