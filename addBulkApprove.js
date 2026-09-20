const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldModal = `            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {bonusRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Không có học sinh nào giơ tay.</div>
              ) : (
                <div className="space-y-3">`;

const newModal = `            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {bonusRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Không có học sinh nào giơ tay.</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-end mb-4">
                    <button 
                      onClick={() => {
                        if(socket && sessionCode) {
                          bonusRequests.forEach(studentId => {
                             socket.emit('approve_individual_bonus', { code: sessionCode, studentId, points: 1 });
                          });
                          setBonusRequests([]);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm flex items-center transition-colors"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" /> Duyệt tất cả
                    </button>
                  </div>`;

content = content.replace(oldModal, newModal);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Added bulk approve button to modal');
