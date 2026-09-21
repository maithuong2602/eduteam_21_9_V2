const fs = require('fs');
let content = fs.readFileSync('src/app/api/drive/route.ts', 'utf8');

content = content.replace(
  "(chunk) =>",
  "(chunk: any) =>"
);
content = content.replace(
  "(err) =>",
  "(err: any) =>"
);

fs.writeFileSync('src/app/api/drive/route.ts', content);
console.log('Fixed implicit any errors');
