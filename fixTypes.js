const fs = require('fs');
let content = fs.readFileSync('src/app/api/drive/route.ts', 'utf8');

// Fix TypeScript error by casting response.data to any
content = content.replace(
  "response.data.on('data'",
  "(response.data as any).on('data'"
);
content = content.replace(
  "response.data.on('end'",
  "(response.data as any).on('end'"
);
content = content.replace(
  "response.data.on('error'",
  "(response.data as any).on('error'"
);

fs.writeFileSync('src/app/api/drive/route.ts', content);
console.log('Fixed Drive API types');
