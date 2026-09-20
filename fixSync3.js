const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldUseEffect = `          if (socket && sessionCode) socket.emit("sync_groups", { code: sessionCode, groups: data.groups });`;
const newUseEffect = `          if (socket && sessionCode) {
            const cName = selectedClassForModal || classList.find((c: any) => c.id === selectedClass)?.name;
            const classGroups = data.groups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
            socket.emit("sync_groups", { code: sessionCode, groups: classGroups.length > 0 ? classGroups : data.groups });
          }`;

content = content.replace(oldUseEffect, newUseEffect);
fs.writeFileSync(file, content);
console.log('Fixed sync_groups in useEffect');
