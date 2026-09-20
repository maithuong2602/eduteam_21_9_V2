import { NextResponse } from 'next/server';
import { getExcelData } from '@/lib/excelDb';

export async function GET() {
  try {
    const data = getExcelData();
    return NextResponse.json({ classes: data.classes });
  } catch (error) {
    console.error('Error reading excel DB:', error);
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }
}
