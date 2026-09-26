import * as xlsx from 'xlsx';
import { getExcelPath } from './dataConfig';

let cachedData: any = null;

export function getExcelData() {
  if (cachedData) return cachedData;

  const filePath = getExcelPath('02_DANH_SACH_HOC_SINH.xlsx');
  const fs = require('fs');
  if (!fs.existsSync(filePath)) { console.error('Excel file missing:', filePath); return { classes: [], students: [] }; }
  const buffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  // Transform data into a structured format
  const classesMap = new Map();
  const students: any[] = [];

  data.forEach((row: any) => {
    const classId = row['Class_ID'];
    if (!classId) return;

    if (!classesMap.has(classId)) {
      classesMap.set(classId, {
        id: classId,
        name: row['Tên lớp'],
        grade: row['Tên lớp']?.split('/')[0] || '', // Parse grade from class name e.g. "6/1" -> "6"
        studentCount: 0
      });
    }

    const currentClass = classesMap.get(classId);
    currentClass.studentCount++;

    students.push({
      id: row['Student_ID'],
      systemId: row['Mã HS'], // original system code
      name: row['Họ và tên'],
      status: row['Trạng thái'],
      classId: classId
    });
  });

  cachedData = {
    classes: Array.from(classesMap.values()),
    students
  };

  return cachedData;
}

let cachedActivityData: any = null;

export function getActivityData() {
  if (cachedActivityData) return cachedActivityData;

  const filePath = getExcelPath('04_HOAT_DONG.xlsx');
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const buffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const activities = data.map((row: any) => {
    // Determine Mode
    let mode = 'INDIVIDUAL';
    const modeRaw = row['Chế độ trả lời'] || row['Mode'];
    if (modeRaw && String(modeRaw).toUpperCase() === 'GROUP') {
      mode = 'GROUP';
    } else if (modeRaw && String(modeRaw).toLowerCase().includes('nhóm')) {
      mode = 'GROUP';
    }

    // Determine BonusType
    let bonusType = 'NONE';
    const bonusTypeRaw = row['BonusType'];
    if (bonusTypeRaw) {
      const bt = String(bonusTypeRaw).toUpperCase();
      if (bt === 'INDIVIDUAL' || bt === 'GROUP') {
        bonusType = bt;
      }
    }

    return {
      Activity_ID: row['Activity_ID'] || `ACT_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      name: row['Tên hoạt động'] || '',
      type: row['Loại hoạt động'] || 'MULTIPLE_CHOICE',
      mode: mode,
      timerDuration: row['Thời gian (phút)'] ? Number(row['Thời gian (phút)']) * 60 : 0,
      points: row['Điểm tối đa'] || row['Điểm'] || 1,
      gradingMethod: row['Cách chấm'] || 'Thủ công',
      allowEdit: row['Cho phép sửa sau khi nộp'] === 'Có' || row['Cho phép sửa'] === 'Có' || row['Cho phép sửa'] === true,
      showResults: row['Hiển thị kết quả ngay'] === 'Có' || row['Hiển thị kết quả'] === 'Có' || row['Hiển thị kết quả'] === true,
      permissions: row['Quyền thao tác'] || '',
      status: row['Trạng thái'] || 'Nháp',
      bonusType: bonusType,
      bonusPoints: Number(row['BonusPoints']) || 0,
      slideNumber: row['Slide_ID'] ? Number(row['Slide_ID']) : null
    };
  });

  cachedActivityData = activities;
  return cachedActivityData;
}
