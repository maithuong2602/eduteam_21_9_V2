const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

code = code.replace(
  "socket?.emit('submit_answer', {\n        code: sessionCode,\n        studentId: realStudentName || studentName,\n        answer: answers\n      });\n      setSubmitted(true);",
  "// socket?.emit('submit_answer', {\n      //   code: sessionCode,\n      //   studentId: realStudentName || studentName,\n      //   answer: answers\n      // });\n      // setSubmitted(true);"
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code, 'utf8');
