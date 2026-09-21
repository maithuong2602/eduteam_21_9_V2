import { NextResponse } from 'next/server';
import { getExcelData } from '@/lib/excelDb';
import { jsonDb } from '@/lib/jsonDb';

export async function GET() {
  try {
    const data = getExcelData();
    const classes = data.classes.map((c: any) => {
      const code = jsonDb.getClassCode(c.id);
      const ledgers = jsonDb.getLedgersByClass(c.id);
      
      const resetLedgers = ledgers.filter(l => l.type === 'RESET');
      const latestResetTime = resetLedgers.length > 0 ? Math.max(...resetLedgers.map(l => l.createdAt)) : 0;
      
      const activeLedgers = ledgers.filter(l => l.createdAt >= latestResetTime && l.type !== 'RESET');
      const cumulativeBonus = activeLedgers.reduce((sum, l) => sum + (l.points || 0), 0);

      return {
        ...c,
        code,
        cumulativeBonus
      };
    });
    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Error reading excel DB:', error);
    return NextResponse.json({ error: 'Failed to load classes', details: (error as Error).message, stack: (error as Error).stack, cwd: process.cwd(), dir: __dirname }, { status: 500 });
  }
}
