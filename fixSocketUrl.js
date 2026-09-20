const fs = require('fs');
let contentTeacher = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');
contentTeacher = contentTeacher.replace(/io\("http:\/\/localhost:3001"\)/g, 'io(`http://${window.location.hostname}:3001`)');
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', contentTeacher);

let contentStudent = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');
contentStudent = contentStudent.replace(/io\("http:\/\/localhost:3001"\)/g, 'io(`http://${window.location.hostname}:3001`)');
fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', contentStudent);
console.log('Fixed hardcoded localhost in socket connections');
