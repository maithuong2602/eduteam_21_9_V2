const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace sync_groups in createGroup
const oldCreateEnd = `    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    if (socket && sessionCode) socket.emit('sync_groups', { code: sessionCode, groups: newGroups });
  };`;
const newCreateEnd = `    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    if (socket && sessionCode) {
      const cName = selectedClassForModal || classList.find((c: any) => c.id === selectedClass)?.name;
      const classGroups = newGroups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
      socket.emit('sync_groups', { code: sessionCode, groups: classGroups.length > 0 ? classGroups : newGroups });
    }
  };`;
content = content.replace(oldCreateEnd, newCreateEnd);

// Replace sync_groups in updateGroupName
const oldUpdate = `  const updateGroupName = (groupId: string, name: string) => {
    const newGroups = groups.map(g => g.id === groupId ? { ...g, name } : g);
    setGroups(newGroups);
    if (socket && sessionCode) socket.emit('sync_groups', { code: sessionCode, groups: newGroups });
  };`;
const newUpdate = `  const updateGroupName = (groupId: string, name: string) => {
    const newGroups = groups.map((g: any) => g.id === groupId ? { ...g, name } : g);
    setGroups(newGroups);
    if (socket && sessionCode) {
      const cName = selectedClassForModal || classList.find((c: any) => c.id === selectedClass)?.name;
      const classGroups = newGroups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
      socket.emit('sync_groups', { code: sessionCode, groups: classGroups.length > 0 ? classGroups : newGroups });
    }
  };`;
content = content.replace(oldUpdate, newUpdate);

// Replace sync_groups in assignStudentToGroup
const oldAssign = `      }
      return g;
    });
    setGroups(newGroups);
    if (socket && sessionCode) socket.emit('sync_groups', { code: sessionCode, groups: newGroups });
  };`;
const newAssign = `      }
      return g;
    });
    setGroups(newGroups);
    if (socket && sessionCode) {
      const cName = selectedClassForModal || classList.find((c: any) => c.id === selectedClass)?.name;
      const classGroups = newGroups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
      socket.emit('sync_groups', { code: sessionCode, groups: classGroups.length > 0 ? classGroups : newGroups });
    }
  };`;
content = content.replace(oldAssign, newAssign);

fs.writeFileSync(file, content);
console.log('Fixed sync_groups in UI handlers');
