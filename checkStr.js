const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const targetStr = '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">';
const startIndex = code.indexOf(targetStr);

console.log('Start index:', startIndex);
