const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldModalContent = `                  {bonusRequests.map(studentId => {
                    const st = allStudentsFromExcel.find(s => s.id === studentId || s.systemId === studentId);
                    const myGroup = groups.find(g => g.members && g.members.some((m:any) => String(m.studentId) === String(studentId) || String(m.studentId) === String(st?.id)))?.name || "Chưa nhóm";
                    return (
                      <div key={studentId} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div>
                          <p className="font-bold text-gray-800">{st ? st.name : studentId} ({myGroup})</p>
                          <p className="text-xs text-gray-500">{st ? st.className : ''}</p>
                        </div>
                        <button 
                          onClick={() => {
                            if(socket && sessionCode) {
                              socket.emit('approve_individual_bonus', { code: sessionCode, studentId, points: 1 });
                            }
                          }}
                          className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded hover:bg-green-600 shadow-sm"
                        >
                          Cộng 1 điểm
                        </button>
                      </div>
                    );
                  })}`;

const newModalContent = `                  {bonusRequests.map(studentId => {
                    const st = classStudents.find(s => String(s.id) === String(studentId) || String(s.systemId) === String(studentId)) || allStudentsFromExcel.find(s => String(s.id) === String(studentId) || String(s.systemId) === String(studentId));
                    const myGroup = groups.find(g => g.members && g.members.some((m:any) => String(m.studentId) === String(studentId) || String(m.studentId) === String(st?.id) || String(m.studentId) === String(st?.systemId)))?.name || "Chưa có nhóm";
                    return (
                      <div key={studentId} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div>
                          <p className="font-bold text-gray-800">{st ? st.name : studentId} <span className="text-sm font-normal text-indigo-600">({myGroup})</span></p>
                          <p className="text-xs text-gray-500">{st ? st.className : ''}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if(socket && sessionCode) {
                                socket.emit('reject_bonus_request', { code: sessionCode, studentId });
                              }
                            }}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-bold rounded hover:bg-gray-300 shadow-sm transition-colors"
                          >
                            Hủy
                          </button>
                          <button 
                            onClick={() => {
                              if(socket && sessionCode) {
                                socket.emit('approve_individual_bonus', { code: sessionCode, studentId, points: 1 });
                              }
                            }}
                            className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded hover:bg-green-600 shadow-sm transition-colors"
                          >
                            Cộng 1 điểm
                          </button>
                        </div>
                      </div>
                    );
                  })}`;

content = content.replace(oldModalContent, newModalContent);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Updated Teacher UI Modal with Reject button and better lookup');
