const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const startTarget = '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">';
const startIndex = code.indexOf(startTarget);
if (startIndex === -1) {
  console.log("Start target not found!");
  process.exit(1);
}

// Find the end of this map block
const endPattern = '                    })}\n                  </div>';
const endIndex = code.indexOf(endPattern, startIndex);
if (endIndex === -1) {
  console.log("End target not found!");
  process.exit(1);
}

const finalEndIndex = endIndex + endPattern.length;
const blockToReplace = code.substring(startIndex, finalEndIndex);
console.log("Found block of length:", blockToReplace.length);

const newRendering = `                    {currentActivity?.type === 'SHORT_ANSWER' ? (
                      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {(currentActivity?.mode === 'GROUP' ? Object.values(workspaces).map(ws => [ws.groupId, ws.state]) : Object.entries(responses)).map(([id, ans]) => {
                          const displayName = currentActivity?.mode === 'GROUP' 
                            ? (groups.find(g => g.id === id)?.name || id)
                            : (students.find(s => s.id === id)?.name || 'Học sinh ẩn danh');
                            
                          let ansText = typeof ans === 'object' ? JSON.stringify(ans) : String(ans);
                          ansText = Array.isArray(ans) ? ans.join(', ') : String(ans);
                          
                          return (
                            <div key={String(id)} className="break-inside-avoid bg-[#fff9c4] border border-[#f57f17]/20 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-4">
                              <div className="font-bold text-[#f57f17] border-b border-[#f57f17]/20 pb-2 mb-2 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#f57f17] text-white flex items-center justify-center text-xs">{displayName.charAt(0)}</div>
                                <span className="truncate">{displayName}</span>
                              </div>
                              <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{ansText}</div>
                              {currentActivity?.mode === 'GROUP' && workspaces[id]?.status === 'SUBMITTED' && (
                                <button onClick={() => {
                                  const grp = groups.find(g => g.id === String(id));
                                  if (grp) {
                                    setGroupApprovalModal({
                                      groupId: grp.id,
                                      name: grp.name,
                                      members: grp.members || [],
                                      selectedMembers: (grp.members || []).map((m: any) => m.studentId)
                                    });
                                  }
                                }} className="mt-3 w-full bg-green-500 text-white px-3 py-1.5 rounded-md text-sm font-bold hover:bg-green-600 transition-colors">
                                  Duyệt điểm
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(currentActivity?.mode === 'GROUP' ? Object.values(workspaces).map(ws => [ws.groupId, ws.state]) : Object.entries(responses)).map(([id, ans]) => {
                          const displayName = currentActivity?.mode === 'GROUP' 
                            ? (groups.find(g => g.id === id)?.name || id)
                            : (students.find(s => s.id === id)?.name || 'Học sinh ẩn danh');
                            
                          let ansText = typeof ans === 'object' ? JSON.stringify(ans) : String(ans);
                          if (currentActivity?.type === 'MULTIPLE_CHOICE') {
                            const ansIds = Array.isArray(ans) ? ans : [ans];
                            ansText = ansIds.map((optId: any) => {
                              const idx = (currentActivity.options || []).findIndex((o:any) => o.id === optId);
                              return idx >= 0 ? String.fromCharCode(65 + idx) : '';
                            }).join(', ');
                          } else if (currentActivity?.type === 'WORD_CLOUD' || currentActivity?.type === 'SHORT_ANSWER') {
                            ansText = Array.isArray(ans) ? ans.join(', ') : String(ans);
                          }
                          
                          return (
                            <div key={String(id)} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                              <span className="font-medium text-gray-700">{displayName}</span>
                              <div className="flex items-center space-x-2 overflow-hidden">
                                <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md max-w-[150px] truncate" title={ansText}>{ansText}</span>
                                {currentActivity?.mode === 'GROUP' && workspaces[id]?.status === 'SUBMITTED' && (
                                  <button onClick={() => {
                                    const grp = groups.find(g => g.id === String(id));
                                    if (grp) {
                                      setGroupApprovalModal({
                                        groupId: grp.id,
                                        name: grp.name,
                                        members: grp.members || [],
                                        selectedMembers: (grp.members || []).map((m: any) => m.studentId)
                                      });
                                    }
                                  }} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-bold hover:bg-green-600 shrink-0">
                                    Duyệt
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}`;

const newCode = code.substring(0, startIndex) + newRendering + code.substring(finalEndIndex);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', newCode);
console.log('Successfully applied Padlet style logic');
