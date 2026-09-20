const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

// Add state
const oldState = `  const [showResultsModal, setShowResultsModal] = useState(false);`;
const newState = `  const [showResultsModal, setShowResultsModal] = useState(false);
  const [groupApprovalModal, setGroupApprovalModal] = useState<{ groupId: string, name: string, members: any[], selectedMembers: string[] } | null>(null);`;
content = content.replace(oldState, newState);

// Add Duyệt button
const oldResultItem = `                        <div key={String(id)} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <span className="font-medium text-gray-700">{displayName}</span>
                          <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md max-w-[50%] truncate" title={ansText}>{ansText}</span>
                        </div>`;
const newResultItem = `                        <div key={String(id)} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
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
                        </div>`;
content = content.replace(oldResultItem, newResultItem);

// Add Modal
const oldModalEnd = `      )}
    </div>
  );
}`;
const newModalEnd = `      )}

      {/* Group Approval Modal */}
      {groupApprovalModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-8 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden relative p-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">
              Duyệt điểm cộng - {groupApprovalModal.name}
            </h2>
            <div className="text-sm text-gray-600 mb-4">
              Hãy đánh dấu (×) để loại bỏ những học sinh không tham gia trả lời. Những học sinh còn lại trong danh sách sẽ được cộng điểm khi bạn bấm Đồng ý.
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto mb-6 space-y-2">
              {groupApprovalModal.members.map((m: any) => {
                const isSelected = groupApprovalModal.selectedMembers.includes(m.studentId);
                return (
                  <div key={m.studentId} className={\`flex justify-between items-center p-3 border rounded-lg transition-colors \${isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-100 opacity-50'}\`}>
                    <div>
                      <div className="font-bold text-gray-800">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.studentId} - {m.role}</div>
                    </div>
                    <button
                      onClick={() => {
                        setGroupApprovalModal(prev => {
                          if (!prev) return prev;
                          if (isSelected) {
                            return { ...prev, selectedMembers: prev.selectedMembers.filter(id => id !== m.studentId) };
                          } else {
                            return { ...prev, selectedMembers: [...prev.selectedMembers, m.studentId] };
                          }
                        });
                      }}
                      className={\`font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full transition-colors \${isSelected ? 'text-red-500 hover:bg-red-100' : 'text-green-600 hover:bg-green-200'}\`}
                    >
                      {isSelected ? '×' : '+'}
                    </button>
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-end space-x-3 mt-auto">
              <button 
                onClick={() => setGroupApprovalModal(null)} 
                className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  if (socket && sessionCode && currentActivityId) {
                    socket.emit('approve_group_points', {
                      code: sessionCode,
                      activityId: currentActivityId,
                      scores: { [groupApprovalModal.groupId]: currentActivity?.points || 1 },
                      approvedMembers: { [groupApprovalModal.groupId]: groupApprovalModal.selectedMembers }
                    });
                    setGroupApprovalModal(null);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Đồng ý cộng điểm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;
content = content.replace(oldModalEnd, newModalEnd);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Added Group Approval Modal');
