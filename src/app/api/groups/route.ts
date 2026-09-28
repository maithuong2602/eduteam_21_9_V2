import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

import { getExcelPath } from '@/lib/dataConfig';

import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

import { getExcelPath } from '@/lib/dataConfig';
import { jsonDb } from '@/lib/jsonDb';

export async function GET() {
  const filePath = getExcelPath('03_NHOM_HOC_SINH.xlsx');
  let excelGroups: any[] = [];
  
  if (fs.existsSync(filePath)) {
    try {
      const buffer = fs.readFileSync(filePath);
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      
      const groupsMap = new Map();
      
      data.forEach((row: any) => {
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
      
      excelGroups = Array.from(groupsMap.values());
    } catch (error) {
      console.error('Error parsing groups:', error);
    }
  }

  const dbGroups = jsonDb.getGroups();
  
  // Merge groups: jsonDb groups override excel groups if they have the same ID.
  const allGroups = [...excelGroups];
  
  for (const dbG of dbGroups) {
     const idx = allGroups.findIndex(g => g.id === dbG.id);
     if (idx >= 0) {
       allGroups[idx] = dbG;
     } else {
       allGroups.push(dbG);
     }
  }
  
  return NextResponse.json({ groups: allGroups });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, studentId, groupId, classId, className, groupName } = body;
    
    let dbGroups = jsonDb.getGroups();
    
    if (action === 'ASSIGN') {
      // Remove student from any existing group
      dbGroups = dbGroups.map(g => ({
        ...g,
        members: g.members.filter(m => m.studentId !== studentId)
      }));
      
      // Remove empty groups (unless it's the one we're assigning to, which won't be empty)
      // Actually, user says: "Nếu logic hiện tại có chức năng xóa group: -> xóa group phải xử lý toàn bộ member thành Ungrouped. Không tự động xóa group nếu hệ thống hiện tại cần giữ group."
      // So let's NOT auto-delete empty groups.
      
      // Find or create the target group
      let targetGroup = dbGroups.find(g => g.id === groupId);
      if (!targetGroup) {
        targetGroup = {
          id: groupId,
          name: groupName || groupId,
          className: className || classId,
          members: []
        };
        dbGroups.push(targetGroup);
      }
      
      // Add student
      targetGroup.members.push({ studentId, joinedAt: Date.now() });
      
    } else if (action === 'REMOVE') {
      // Remove student from all groups
      dbGroups = dbGroups.map(g => ({
        ...g,
        members: g.members.filter(m => m.studentId !== studentId)
      }));
    }
    
    jsonDb.saveGroups(dbGroups);
    return NextResponse.json({ success: true, groups: dbGroups });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
