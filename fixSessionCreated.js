const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldSessionCreated = `    newSocket.on("session_created", (data) => {
      setSessionCode(data.code);
      // Immediately sync only the groups for the selected class to prevent sending all 246 groups
      if (selectedClass && groups.length > 0) {
        const currentClassName = classList.find((c: any) => c.id === selectedClass)?.name;
        if (currentClassName) {
          const classGroups = groups.filter((g: any) => g.className === currentClassName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === currentClassName)));
          newSocket.emit("sync_groups", { code: data.code, groups: classGroups });
        } else {
          newSocket.emit("sync_groups", { code: data.code, groups });
        }
      } else {
        newSocket.emit("sync_groups", { code: data.code, groups });
      }
    });`;

const newSessionCreated = `    newSocket.on("session_created", (data) => {
      setSessionCode(data.code);
      if (selectedClass && groups.length > 0) {
        const currentClassName = classList.find((c: any) => c.id === selectedClass)?.name;
        if (currentClassName) {
          const classGroups = groups.filter((g: any) => g.className === currentClassName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === currentClassName)));
          newSocket.emit("sync_groups", { code: data.code, groups: classGroups });
        } else {
          newSocket.emit("sync_groups", { code: data.code, groups: [] });
        }
      } else {
        newSocket.emit("sync_groups", { code: data.code, groups: [] });
      }
    });`;

content = content.replace(oldSessionCreated, newSessionCreated);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Fixed session_created to emit [] instead of all groups');
