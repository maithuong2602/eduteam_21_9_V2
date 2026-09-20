const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('const getSuffix = (cName) => {', 'const getSuffix = (cName: any) => {');
content = content.replace('uniqueClasses.filter(c => getSuffix(c)', 'uniqueClasses.filter(c => getSuffix(c as string)');
fs.writeFileSync(file, content);
console.log('Fixed typescript errors globally 2');
