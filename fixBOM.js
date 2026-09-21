const fs = require('fs');

// Fix api/upload/route.ts
let uploadCode = fs.readFileSync('src/app/api/upload/route.ts', 'utf8');
uploadCode = uploadCode.replace(
  "const creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));",
  "const decoded = Buffer.from(b64, 'base64').toString('utf8');\n  const creds = JSON.parse(decoded.charCodeAt(0) === 0xFEFF ? decoded.slice(1) : decoded);"
);
fs.writeFileSync('src/app/api/upload/route.ts', uploadCode);

// Fix api/drive/route.ts
let driveCode = fs.readFileSync('src/app/api/drive/route.ts', 'utf8');
driveCode = driveCode.replace(
  "const creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));",
  "const decoded = Buffer.from(b64, 'base64').toString('utf8');\n    const creds = JSON.parse(decoded.charCodeAt(0) === 0xFEFF ? decoded.slice(1) : decoded);"
);
fs.writeFileSync('src/app/api/drive/route.ts', driveCode);

console.log('Fixed BOM issue');
