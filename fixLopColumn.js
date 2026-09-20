const fs = require('fs');

// 1. Update server.js
let serverContent = fs.readFileSync('server.js', 'utf8');

const oldCreateSession = `      validStudents: data.validStudents || [],
      presentationType: data.presentationType,`;
const newCreateSession = `      validStudents: data.validStudents || [],
      className: data.className || "N/A",
      presentationType: data.presentationType,`;

const oldExport = `          studentPoints: session.studentPoints || {},
          validStudents: session.validStudents || []
       });`;
const newExport = `          studentPoints: session.studentPoints || {},
          validStudents: session.validStudents || [],
          className: session.className || "N/A"
       });`;

serverContent = serverContent.replace(oldCreateSession, newCreateSession);
serverContent = serverContent.replace(oldExport, newExport);
fs.writeFileSync('server.js', serverContent);

// 2. Update Teacher UI page.tsx
let uiContent = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldEmit = `      socket.emit("create_session", { 
        presentationId: presentation.id, 
        title: presentation.title,
        validStudents: classStudents,
        presentationType: presentation.type,`;
const newEmit = `      socket.emit("create_session", { 
        presentationId: presentation.id, 
        title: presentation.title,
        validStudents: classStudents,
        className: classList.find((c: any) => c.id === selectedClass)?.name || "N/A",
        presentationType: presentation.type,`;

const oldRow = `             "Tên HS": st.name,
             "Lớp": classList.find((c: any) => c.id === selectedClass)?.name || "N/A",
             "Nhóm": groups.find(g => g.members && g.members.some((m: any) => m.studentId === st.id))?.name || "Chưa có nhóm",`;
const newRow = `             "Tên HS": st.name,
             "Lớp": data.className || "N/A",
             "Nhóm": groups.find(g => g.members && g.members.some((m: any) => m.studentId === st.id))?.name || "Chưa có nhóm",`;

uiContent = uiContent.replace(oldEmit, newEmit);
uiContent = uiContent.replace(oldRow, newRow);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', uiContent);

console.log('Fixed Lớp column in Excel Export');
