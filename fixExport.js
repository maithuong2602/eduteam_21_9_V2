const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix Excel Export empty rows issue
content = content.replace(
  'presentation?.validStudents?.forEach((s: any) => {',
  '(presentation?.validStudents || classStudents)?.forEach((s: any) => {'
);
content = content.replace(
  'const rows = presentation?.validStudents?.map((st: any) => {',
  'const rows = (presentation?.validStudents || classStudents)?.map((st: any) => {'
);

fs.writeFileSync(file, content);
console.log('Fixed exportExcel issue');
