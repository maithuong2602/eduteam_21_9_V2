const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');
console.log(code.substring(70325 + 2000, 70325 + 3500));
