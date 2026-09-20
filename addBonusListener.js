const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldEffect = `    newSocket.on("export_ledgers_ready", (data) => {`;
const newEffect = `    newSocket.on('student_requested_bonus', (studentId: string) => {
      setBonusRequests((prev: string[]) => {
        if (!prev.includes(studentId)) return [...prev, studentId];
        return prev;
      });
    });
    
    newSocket.on("export_ledgers_ready", (data) => {`;

content = content.replace(oldEffect, newEffect);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Added student_requested_bonus to Teacher UI');
