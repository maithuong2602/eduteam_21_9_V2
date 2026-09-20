const fs = require('fs');
let fileContent = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldCode = `             "Lớp": classList.find((c: any) => c.id === selectedClass)?.name || "N/A",
             "Tổng điểm": stat.total,`;
const newCode = `             "Lớp": classList.find((c: any) => c.id === selectedClass)?.name || "N/A",
             "Nhóm": groups.find(g => g.members && g.members.some((m: any) => m.studentId === st.id))?.name || "Chưa có nhóm",
             "Tổng điểm": stat.total,`;

fileContent = fileContent.replace(oldCode, newCode);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', fileContent);
console.log('Added Nhóm column to excel export');
