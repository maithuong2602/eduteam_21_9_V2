const fs = require('fs');
const xlsx = require('xlsx');
const dir = 'C:/DuAn/EDUTEAM_BO_DU_LIEU_DAU_VAO';
const studentsFile = dir + '/02_DANH_SACH_HOC_SINH.xlsx';
const d2Wb = xlsx.readFile(studentsFile);
const d2Sheet = d2Wb.Sheets[d2Wb.SheetNames[0]];
const allStudents = xlsx.utils.sheet_to_json(d2Sheet);

const wb = xlsx.readFile(dir + '/Khoi7.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});

let count = 0;
for (let i = 5; i < 50; i++) {
    const row = data[i];
    if (!row || !row[1] || row[1] === 'H? và tên') continue;
    const name = String(row[1]).trim().normalize('NFC');
    const className = row[2];
    const st = allStudents.find(s => s['H? và tên'] && String(s['H? và tên']).trim().normalize('NFC') === name);
    if (st) count++;
    else console.log('Not found in 02:', name);
}
console.log('Found:', count);
