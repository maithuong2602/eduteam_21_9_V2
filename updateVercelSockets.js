const fs = require('fs');

function updateFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/io\(\)/g, "io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined)");
  fs.writeFileSync(filepath, content);
}

updateFile('src/app/teacher/presentations/[id]/page.tsx');
updateFile('src/app/student/[sessionCode]/page.tsx');
console.log('Updated client socket connections for Vercel support');
