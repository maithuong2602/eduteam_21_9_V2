const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldAssignEnd = `    setGroups(newGroups);
    if (socket && sessionCode) socket.emit('sync_groups', { code: sessionCode, groups: newGroups });
  };`;

const newAssignEnd = `    setGroups(newGroups);
    if (socket && sessionCode) {
      const cName = selectedClassForModal || classList.find((c: any) => c.id === selectedClass)?.name;
      const classGroups = !cName ? [] : newGroups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
      socket.emit('sync_groups', { code: sessionCode, groups: classGroups });
    }
  };`;

content = content.replace(oldAssignEnd, newAssignEnd);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Fixed assignStudentToGroup sync_groups emit');
