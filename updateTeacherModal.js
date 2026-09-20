const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldModalRender = `                  {bonusRequests.map(studentId => {
                    const st = allStudentsFromExcel.find(s => s.id === studentId || s.systemId === studentId);
                    return (
                      <div key={studentId} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div>
                          <p className="font-bold text-gray-800">{st ? st.name : studentId}</p>
                          <p className="text-xs text-gray-500">{st ? st.className : ''}</p>`;

const newModalRender = `                  {bonusRequests.map(studentId => {
                    const st = allStudentsFromExcel.find(s => s.id === studentId || s.systemId === studentId);
                    const myGroup = groups.find(g => g.members && g.members.some((m:any) => String(m.studentId) === String(studentId) || String(m.studentId) === String(st?.id)))?.name || "Chưa nhóm";
                    return (
                      <div key={studentId} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div>
                          <p className="font-bold text-gray-800">{st ? st.name : studentId} ({myGroup})</p>
                          <p className="text-xs text-gray-500">{st ? st.className : ''}</p>`;

content = content.replace(oldModalRender, newModalRender);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Updated Teacher UI Modal with Group Name');
