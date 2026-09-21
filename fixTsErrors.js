const fs = require('fs');

// Fix api/classes/route.ts
let classesCode = fs.readFileSync('src/app/api/classes/route.ts', 'utf8');
classesCode = classesCode.replace(
  "error.message",
  "(error as Error).message"
);
classesCode = classesCode.replace(
  "error.stack",
  "(error as Error).stack"
);
fs.writeFileSync('src/app/api/classes/route.ts', classesCode);

// Fix api/upload/route.ts
let uploadCode = fs.readFileSync('src/app/api/upload/route.ts', 'utf8');
uploadCode = uploadCode.replace(
  "const fileId = driveRes.data.id;",
  "const fileId = driveRes.data.id as string;"
);
fs.writeFileSync('src/app/api/upload/route.ts', uploadCode);

console.log('Fixed TS errors');
