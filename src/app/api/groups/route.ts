import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'src', 'data', '03_NHOM_HOC_SINH.xlsx');
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ groups: [] });
  }
  
  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    const groupsMap = new Map();
    
    data.forEach((row: any) => {
      // Isolate group IDs by Session_ID to prevent merging "Nhóm 1" of class A with "Nhóm 1" of class B
      let groupId = '';
      if (row['Session_ID'] && row['Tên nhóm']) {
        groupId = row['Session_ID'] + '_' + row['Tên nhóm'];
      } else {
        groupId = row['Group_ID'] || row['Tên nhóm'];
      }
      
      const groupName = row['Tên nhóm'];
      if (!groupId) return;
      
      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          id: String(groupId),
          name: groupName,
          members: []
        });
      }
      
      if (row['Student_ID']) {
        groupsMap.get(groupId).members.push({
          studentId: String(row['Student_ID']),
          name: row['Họ và tên'] || row['Tên học sinh'],
          role: row['Vai trò'] || 'Thành viên'
        });
      }
    });
    
    return NextResponse.json({ groups: Array.from(groupsMap.values()) });
  } catch (error) {
    console.error('Error parsing groups:', error);
    return NextResponse.json({ groups: [] });
  }
}
