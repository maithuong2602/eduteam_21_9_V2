import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import fs from 'fs';

export async function GET() {
  const filePath = 'C:\\DuAn\\EDUTEAM_BO_DU_LIEU_DAU_VAO\\02_DANH_SACH_HOC_SINH.xlsx';
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ students: [] });
  }
  
  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    const students = data.map((row: any) => ({
      id: String(row['Student_ID'] || row['Mã HS']),
      name: row['Họ và tên'] || row['Tên học sinh'],
      className: row['Tên lớp'] || ''
    }));
    
    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error parsing students:', error);
    return NextResponse.json({ students: [] });
  }
}
