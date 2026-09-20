const fs = require('fs');
const xlsx = require('xlsx');

const dir = 'C:/DuAn/EDUTEAM_BO_DU_LIEU_DAU_VAO';
const originalFile = dir + '/03_NHOM_HOC_SINH.xlsx';
const updateFile = dir + '/03_NHOM_HOC_SINH_UPDATE.xlsx';

let originalData = [];
try {
    const wb1 = xlsx.readFile(originalFile);
    originalData = xlsx.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]]);
} catch(e) {
    console.log('Could not read original, EBUSY?');
}

const wb2 = xlsx.readFile(updateFile);
const updateData = xlsx.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]]);

const combined = [...originalData, ...updateData];

const newWb = xlsx.utils.book_new();
const newWs = xlsx.utils.json_to_sheet(combined);
xlsx.utils.book_append_sheet(newWb, newWs, 'Nhom_Hoc_Sinh');
try {
    xlsx.writeFile(newWb, originalFile);
    console.log('Successfully appended to original file!');
} catch(e) {
    console.log('Failed to write to original file. It might be open in Excel.');
    xlsx.writeFile(newWb, dir + '/03_NHOM_HOC_SINH_COMBINED.xlsx');
    console.log('Wrote to 03_NHOM_HOC_SINH_COMBINED.xlsx instead.');
}
