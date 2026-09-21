const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

code = code.replace(
  'const actsObj = {};',
  'const actsObj: any = {};'
);
code = code.replace(
  'const slideActsObj = {};',
  'const slideActsObj: any = {};'
);
code = code.replace(
  'data.activities.forEach(act => {',
  'data.activities.forEach((act: any) => {'
);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Fixed implicit any errors');
