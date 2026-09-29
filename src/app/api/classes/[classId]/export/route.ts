import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getExcelData } from '@/lib/excelDb';
import { jsonDb } from '@/lib/jsonDb';
import * as xlsx from 'xlsx';

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const data = getExcelData();
    const resolvedParams = await params;
    const classId = decodeURIComponent(resolvedParams.classId).replace(/__slash__/g, '/');

    const students = data.students.filter((s: any) => s.classId === classId);
    const classInfo = data.classes.find((c: any) => c.id === classId);
    
    if (!classInfo) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const ledgers = jsonDb.getLedgersByClass(classId);
    const resetLedgers = ledgers.filter(l => l.type === 'RESET');
    const latestResetTime = resetLedgers.length > 0 ? Math.max(...resetLedgers.map(l => l.createdAt)) : 0;
    const activeLedgers = ledgers.filter(l => l.createdAt >= latestResetTime && l.type !== 'RESET');

    const datesSet = new Set<string>();
    const studentDataMap = new Map<string, any>();
    
    students.forEach((s: any) => {
      studentDataMap.set(s.id, {
        stt: s.stt || '',
        id: s.id,
        name: s.name,
        total: 0,
        dates: {}
      });
    });

    activeLedgers.forEach(l => {
      if (l.studentId === 'ALL') {
        const dateStr = new Date(l.createdAt).toLocaleDateString('vi-VN');
        datesSet.add(dateStr);
        students.forEach((s: any) => {
          const sd = studentDataMap.get(s.id);
          sd.total += l.points;
          sd.dates[dateStr] = (sd.dates[dateStr] || 0) + l.points;
        });
      } else {
        const sd = studentDataMap.get(l.studentId);
        if (sd) {
          const dateStr = new Date(l.createdAt).toLocaleDateString('vi-VN');
          datesSet.add(dateStr);
          sd.total += l.points;
          sd.dates[dateStr] = (sd.dates[dateStr] || 0) + l.points;
        }
      }
    });

    const sortedDates = Array.from(datesSet).sort((a, b) => {
       const [da, ma, ya] = a.split('/').map(Number);
       const [db, mb, yb] = b.split('/').map(Number);
       return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
    });

    const rows = Array.from(studentDataMap.values()).sort((a, b) => (a.stt || 0) - (b.stt || 0)).map((sd: any) => {
      const row: any = {
        'STT': sd.stt,
        'Mã học sinh': sd.id,
        'Tên học sinh': sd.name,
        'Tổng điểm cộng': sd.total
      };
      sortedDates.forEach(d => {
        row[d] = sd.dates[d] || 0;
      });
      return row;
    });

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "DiemCong");
    
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="DiemCong_${classInfo.name.replace(/[^a-z0-9]/gi, '_')}.xlsx"`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
