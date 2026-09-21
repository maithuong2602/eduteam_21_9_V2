const fs = require('fs');
let code = fs.readFileSync('src/app/api/upload/route.ts', 'utf8');
code = code.replace("totalSlides: 1, // dummy value", "totalSlides: (uploadResult as any).pages || 1,");
fs.writeFileSync('src/app/api/upload/route.ts', code);
console.log('Fixed pages count');
