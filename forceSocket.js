const fs = require('fs');

const files = [
  'src/app/join/page.tsx',
  'src/app/student/[sessionCode]/page.tsx',
  'src/app/teacher/presentations/[id]/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Force it to connect to the origin, ignoring the broken environment variable if it exists
  content = content.replace(/io\(process\.env\.NEXT_PUBLIC_SOCKET_URL \|\| undefined\)/g, 'io(undefined)');
  fs.writeFileSync(file, content);
});

console.log('Force removed NEXT_PUBLIC_SOCKET_URL dependency');
