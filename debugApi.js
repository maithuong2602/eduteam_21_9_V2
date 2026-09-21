const fs = require('fs');
let content = fs.readFileSync('src/app/api/classes/route.ts', 'utf8');
content = content.replace(
  "return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });",
  "return NextResponse.json({ error: 'Failed to load classes', details: error.message, stack: error.stack, cwd: process.cwd(), dir: __dirname }, { status: 500 });"
);
fs.writeFileSync('src/app/api/classes/route.ts', content);
