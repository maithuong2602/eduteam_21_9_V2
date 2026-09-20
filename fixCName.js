const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const regex = /const classGroups = (.*?)\.filter\(\(g: any\) => g\.className === cName \|\| \(g\.members && g\.members\.some\(\(m: any\) => allStudentsFromExcel\.find\(\(s: any\) => s\.id === m\.studentId\)\?\.className === cName\)\)\);/g;

content = content.replace(regex, (match, arr) => {
  return `const classGroups = !cName ? [] : ${arr}.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));`;
});

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Fixed cName undefined bug');
