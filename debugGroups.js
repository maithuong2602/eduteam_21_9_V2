const fs = require('fs');
const xlsx = require('xlsx');

const dir = 'C:/DuAn/EDUTEAM_BO_DU_LIEU_DAU_VAO';
const studentsFile = dir + '/02_DANH_SACH_HOC_SINH.xlsx';

const d2Wb = xlsx.readFile(studentsFile);
const d2Sheet = d2Wb.Sheets[d2Wb.SheetNames[0]];
const allStudents = xlsx.utils.sheet_to_json(d2Sheet);

['Khoi7.xlsx'].forEach((file) => {
    const wb = xlsx.readFile(dir + '/' + file);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
    
    let currentClass = [];
    let lastClassName = '';
    
    for (let i = 5; i < 15; i++) {
        const row = data[i];
        if (!row || row.length === 0 || !row[1] || row[1] === 'H? và tên') continue;
        
        const name = row[1];
        const className = row[2];
        console.log('Row:', name, className);
        
        if (className && className !== lastClassName) {
            console.log('Class boundary! currentClass length:', currentClass.length);
            currentClass = [];
            lastClassName = className;
        }
        
        const st = allStudents.find(s => s['H? và tên'] === name);
        if (st) {
            currentClass.push(st);
            console.log('Found:', name);
        } else {
            console.log('Not found:', name);
        }
    }
    console.log('Final length:', currentClass.length);
});
