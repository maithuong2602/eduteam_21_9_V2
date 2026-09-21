const fs = require('fs');
let code = fs.readFileSync('src/app/api/backup/route.ts', 'utf8');
code = code.replace(
  'return new NextResponse(zipBuffer, {',
  'return new NextResponse(zipBuffer as any, {'
);
fs.writeFileSync('src/app/api/backup/route.ts', code);
console.log("Fixed TS error in backup route");
