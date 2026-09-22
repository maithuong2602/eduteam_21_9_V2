const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const regex = /\{presentation\.slides\?\.map\(\(slide: any\) => \{/g;
const replacement = `{Array.from({ length: presentation?.totalSlides || 0 }).map((_, idx) => {
                  const slide = { slideNumber: idx + 1 };`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Successfully patched slide list');
