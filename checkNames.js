const fs = require('fs');
const xlsx = require('xlsx');

const workbook = xlsx.readFile('src/data/02_DANH_SACH_HOC_SINH.xlsx');
const sheet = workbook.Sheets['DanhSachLop']; // Assuming this is the sheet name, wait let's just write a script to use excelDb!
