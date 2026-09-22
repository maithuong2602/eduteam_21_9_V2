const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

code = code.replace(
  '// socket.emit("submit_answer"',
  'socket.emit("submit_answer"'
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code, 'utf8');
