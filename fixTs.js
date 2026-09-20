const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/haiSon.map\(\(cName\) => \(/g, 'haiSon.map((cName: any) => (');
content = content.replace(/hanMacTu.map\(\(cName\) => \(/g, 'hanMacTu.map((cName: any) => (');
content = content.replace(/other.map\(\(cName\) => \(/g, 'other.map((cName: any) => (');
content = content.replace(/g.members.some\(m =>/g, 'g.members.some((m: any) =>');
fs.writeFileSync(file, content);
console.log('Fixed typescript errors globally');
