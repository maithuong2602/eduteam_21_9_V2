const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const workbook = xlsx.readFile(path.join(process.cwd(), 'src', 'data', '03_NHOM_HOC_SINH.xlsx'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);
console.log(data[0]);
