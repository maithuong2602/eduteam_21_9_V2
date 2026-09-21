const fs = require('fs');
let content = fs.readFileSync('src/lib/excelDb.ts', 'utf8');

content = content.replace(
  "const buffer = fs.readFileSync(filePath);",
  "if (!fs.existsSync(filePath)) { console.error('Excel file missing:', filePath); return { classes: [], students: [] }; }\n  const buffer = fs.readFileSync(filePath);"
);

fs.writeFileSync('src/lib/excelDb.ts', content);
console.log('Added existsSync fallback to excelDb');
