const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');
code = code.replace(/\/\* socket\.emit\("submit_answer", {/g, 'socket.emit("submit_answer", {');
code = code.replace(/    }\); \*\/\r?\n    setSubmitted\(true\);/g, '    });\r\n    setSubmitted(true);');
fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code, 'utf8');
