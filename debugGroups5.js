const fs = require('fs');
const xlsx = require('xlsx');

const dir = 'C:/DuAn/EDUTEAM_BO_DU_LIEU_DAU_VAO';
const studentsFile = dir + '/02_DANH_SACH_HOC_SINH.xlsx';

const d2Wb = xlsx.readFile(studentsFile);
const allStudents = xlsx.utils.sheet_to_json(d2Wb.Sheets['Sheet1']);

const studentMap = {};
for (const s of allStudents) {
    if (s['H? và tên']) {
        studentMap[String(s['H? và tên']).trim()] = s;
    }
}

let generated = 0;

['Khoi7.xlsx'].forEach((file) => {
    const wb = xlsx.readFile(dir + '/' + file);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
    
    let currentClassStudents = [];
    let lastClassName = '';
    
    for (let i = 0; i < 10; i++) {
        const row = data[i];
        if (!row || row.length < 3) {
            console.log('Skipping row', i, 'because no row or len < 3');
            continue;
        }
        if (row[1] === 'H? và tên') {
            console.log('Skipping row', i, 'header');
            continue;
        }
        
        const name = String(row[1]).trim();
        const className = String(row[2]).trim();
        if (!name || name === 'undefined' || !className || className === 'undefined') {
            console.log('Skipping row', i, 'because name/className empty', name, className);
            continue;
        }

        console.log('Processing row', i, name, className);

        if (className !== lastClassName) {
            console.log('Class boundary', lastClassName, '->', className);
            currentClassStudents = [];
            lastClassName = className;
        }
        
        const st = studentMap[name];
        if (st) {
            currentClassStudents.push(st);
            console.log('Added', name, 'to currentClassStudents, length:', currentClassStudents.length);
        } else {
            console.log('NOT IN MAP:', name);
        }
    }
    console.log('End of file, currentClassStudents length:', currentClassStudents.length);
});
