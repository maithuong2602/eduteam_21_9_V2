const fs = require('fs');
let fileContent = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldCode1 = `        const statsMap = new Map();
        (presentation?.validStudents || classStudents)?.forEach((s: any) => {`;
const newCode1 = `        const statsMap = new Map();
        (data.validStudents || presentation?.validStudents || classStudents)?.forEach((s: any) => {`;

const oldCode2 = `        const rows = (presentation?.validStudents || classStudents)?.map((st: any) => {`;
const newCode2 = `        const rows = (data.validStudents || presentation?.validStudents || classStudents)?.map((st: any) => {`;

fileContent = fileContent.replace(oldCode1, newCode1);
fileContent = fileContent.replace(oldCode2, newCode2);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', fileContent);
console.log('Fixed UI export_ledgers_ready closure problem');
