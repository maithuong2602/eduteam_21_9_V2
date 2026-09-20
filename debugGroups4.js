const fs = require('fs');
const xlsx = require('xlsx');

const dir = 'C:/DuAn/EDUTEAM_BO_DU_LIEU_DAU_VAO';
const studentsFile = dir + '/02_DANH_SACH_HOC_SINH.xlsx';

const d2Wb = xlsx.readFile(studentsFile);
const d2Sheet = d2Wb.Sheets[d2Wb.SheetNames[0]];
const allStudents = xlsx.utils.sheet_to_json(d2Sheet);

function clean(str) {
    return String(str).replace(/\s+/g, '').toLowerCase().normalize('NFC');
}

console.log('allStudents len:', allStudents.length);

const wb = xlsx.readFile(dir + '/Khoi7.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});

let foundCount = 0;
for (let i = 5; i < 15; i++) {
    const row = data[i];
    if (!row || row.length === 0 || !row[1] || row[1] === 'H? và tên') continue;
    
    const name = row[1];
    const targetClean = clean(name);
    const st = allStudents.find(s => s['H? và tên'] && clean(s['H? và tên']) === targetClean);
    if (st) {
        foundCount++;
        console.log('Found:', name);
    } else {
        console.log('NOT FOUND:', name);
    }
}
console.log('Total found in first 10:', foundCount);
