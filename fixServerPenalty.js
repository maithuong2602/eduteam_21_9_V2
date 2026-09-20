const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const oldRejectCond = `if (session.teacherRejectCount[data.studentId] >= 2) {`;
const newRejectCond = `if (session.teacherRejectCount[data.studentId] > 0 && session.teacherRejectCount[data.studentId] % 2 === 0) {`;

content = content.replace(oldRejectCond, newRejectCond);
fs.writeFileSync('server.js', content);
console.log('Fixed teacher reject penalty logic in server');
