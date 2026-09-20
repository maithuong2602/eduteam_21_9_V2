const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldHeader = `          {sessionCode && (
            <span className="ml-3 px-3 py-1 rounded text-sm font-bold bg-blue-100 text-blue-800">
              Mã vào lớp: {sessionCode}
            </span>
          )}
        </div>`;

const newHeader = `          {sessionCode && (
            <span className="ml-3 px-3 py-1 rounded text-sm font-bold bg-blue-100 text-blue-800">
              Mã vào lớp: {sessionCode}
            </span>
          )}
          {bonusRequests.length > 0 && (
            <button 
              onClick={() => setShowBonusModal(true)}
              className="ml-4 px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 animate-pulse flex items-center"
            >
              🙋 {bonusRequests.length} HS xin phát biểu
            </button>
          )}
        </div>`;

content = content.replace(oldHeader, newHeader);

// Add the Bonus Modal at the end of the file (before the last </div>)
const modalJSX = `
      {/* Bonus Requests Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Danh sách Giơ tay / Xin điểm</h3>
              <button onClick={() => setShowBonusModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {bonusRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Không có học sinh nào giơ tay.</div>
              ) : (
                <div className="space-y-3">
                  {bonusRequests.map(studentId => {
                    const st = allStudentsFromExcel.find(s => s.id === studentId || s.systemId === studentId);
                    return (
                      <div key={studentId} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div>
                          <p className="font-bold text-gray-800">{st ? st.name : studentId}</p>
                          <p className="text-xs text-gray-500">{st ? st.className : ''}</p>
                        </div>
                        <button 
                          onClick={() => {
                            if(socket && sessionCode) {
                              socket.emit('approve_individual_bonus', { code: sessionCode, studentId, points: 1 });
                              setBonusRequests(prev => prev.filter(id => id !== studentId));
                            }
                          }}
                          className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded hover:bg-green-600 shadow-sm"
                        >
                          Cộng 1 điểm
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
`;

const lastDivIndex = content.lastIndexOf('</div>');
if (lastDivIndex !== -1) {
  content = content.slice(0, lastDivIndex) + modalJSX + content.slice(lastDivIndex);
}

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Added Bonus Requests UI to Teacher');
