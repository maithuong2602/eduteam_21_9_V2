const fs = require('fs');
let content = fs.readFileSync('src/app/join/page.tsx', 'utf8');
content = content.replace(
  'io("http://localhost:3001")',
  'io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined)'
);
fs.writeFileSync('src/app/join/page.tsx', content);
console.log('Fixed join/page.tsx socket URL');
