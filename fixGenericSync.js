const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    if (socket && sessionCode && groups.length > 0) {
      socket.emit('sync_groups', { code: sessionCode, groups });
    }
  }, [socket, sessionCode, groups]);`;

const newEffect = `  useEffect(() => {
    if (socket && sessionCode && groups.length > 0) {
      const cName = classList.find((c: any) => c.id === selectedClass)?.name;
      if (cName) {
        const classGroups = groups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
        socket.emit('sync_groups', { code: sessionCode, groups: classGroups });
      } else {
        socket.emit('sync_groups', { code: sessionCode, groups: [] });
      }
    }
  }, [socket, sessionCode, groups, selectedClass, classList, allStudentsFromExcel]);`;

content = content.replace(oldEffect, newEffect);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Fixed generic sync_groups useEffect');
