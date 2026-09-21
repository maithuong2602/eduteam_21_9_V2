const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

code = code.replace(
  'socket.emit("create_session", { \n        presentationId: presentation.id,',
  'socket.emit("create_session", { \n        classId: selectedClass,\n        presentationId: presentation.id,'
);

code = code.replace(
  'socket.emit("create_session", {\r\n        presentationId: presentation.id,',
  'socket.emit("create_session", {\r\n        classId: selectedClass,\r\n        presentationId: presentation.id,'
);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Added classId to create_session payload');
