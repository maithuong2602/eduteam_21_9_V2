const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(
  'teacherSocketId: socket.id,',
  'teacherSocketId: socket.id,\n      classId: data.classId,'
);

// Update saveLedger calls to include classId: session.classId
code = code.replace(
  /sessionCode: data\.code,/g,
  'sessionCode: data.code,\n      classId: session.classId,'
);

fs.writeFileSync('server.js', code);
console.log('Added classId to ledgers');
