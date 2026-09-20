const fs = require('fs');

// 1. Update server.js
let serverContent = fs.readFileSync('server.js', 'utf8');

const oldExport = `          studentPoints: session.studentPoints || {},
          validStudents: session.validStudents || [],
          className: session.className || "N/A"
       });`;
const newExport = `          studentPoints: session.studentPoints || {},
          validStudents: session.validStudents || [],
          className: session.className || "N/A",
          groups: session.groups || []
       });`;

serverContent = serverContent.replace(oldExport, newExport);
fs.writeFileSync('server.js', serverContent);

// 2. Update Teacher UI page.tsx
let uiContent = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldRow = `             "Nhóm": groups.find(g => g.members && g.members.some((m: any) => m.studentId === st.id))?.name || "Chưa có nhóm",`;
const newRow = `             "Nhóm": (data.groups || groups).find((g: any) => g.members && g.members.some((m: any) => m.studentId === st.id))?.name || "Chưa có nhóm",`;

uiContent = uiContent.replace(oldRow, newRow);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', uiContent);

console.log('Fixed Nhóm closure bug');
