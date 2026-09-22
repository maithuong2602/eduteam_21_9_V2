const xlsx = require('xlsx');
const fs = require('fs');

// Read DB
const db = JSON.parse(fs.readFileSync('src/data/db.json', 'utf8'));
const classCodes = db.classCodes;

// Read Excel
const workbook = xlsx.readFile('src/data/02_DANH_SACH_HOC_SINH.xlsx');
let studentList = [];

// find the sheet
workbook.SheetNames.forEach(sheetName => {
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    studentList = studentList.concat(data);
});

// Assuming student sheet has something like 'MÃ LỚP' or 'ClassID'
// Let's just dump the unique classes if they exist, or check excelDb.ts directly.
