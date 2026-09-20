const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update createGroup
const oldCreate = `  const createGroup = () => {
    const newGroup = {
      id: 'GRP_' + Date.now(),
      name: 'Nhóm ' + (groups.length + 1),
      leaderId: null,
      createdAt: Date.now(),
      members: []
    };
    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    if (socket && sessionCode) socket.emit('sync_groups', { code: sessionCode, groups: newGroups });
  };`;

const newCreate = `  const createGroup = () => {
    if (!selectedClassForModal) {
      alert("Vui lòng chọn lớp học ở cột bên trái trước khi tạo nhóm!");
      return;
    }
    const classGroups = groups.filter(g => g.className === selectedClassForModal || (g.members && g.members.some((m: any) => allStudentsFromExcel.find(s => s.id === m.studentId)?.className === selectedClassForModal)));
    
    const newGroup = {
      id: 'GRP_' + Date.now(),
      name: 'Nhóm ' + (classGroups.length + 1),
      leaderId: null,
      createdAt: Date.now(),
      className: selectedClassForModal,
      members: []
    };
    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    if (socket && sessionCode) socket.emit('sync_groups', { code: sessionCode, groups: newGroups });
  };`;
content = content.replace(oldCreate, newCreate);

// Update Left Panel classes list
const oldLeft = `                  {!selectedClassForModal ? (
                    Array.from(new Set(allStudentsFromExcel.map(s => s.className).filter(Boolean))).map((cName: any) => (
                      <div key={cName} className="flex items-center justify-between p-3 border rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors" onClick={() => setSelectedClassForModal(cName)}>
                        <span className="font-medium text-gray-800">Lớp {cName}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))
                  ) : (`

const newLeft = `                  {!selectedClassForModal ? (
                    (() => {
                      const uniqueClasses = Array.from(new Set(allStudentsFromExcel.map(s => s.className).filter(Boolean)));
                      const getSuffix = (cName) => {
                        const parts = String(cName).split('/');
                        return parts.length > 1 ? parseInt(parts[1]) : 0;
                      };
                      const haiSon = uniqueClasses.filter(c => getSuffix(c) >= 1 && getSuffix(c) <= 6).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
                      const hanMacTu = uniqueClasses.filter(c => getSuffix(c) >= 7).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
                      const other = uniqueClasses.filter(c => getSuffix(c) === 0).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
                      
                      return (
                        <div className="space-y-4 pr-1">
                          {haiSon.length > 0 && (
                            <div>
                              <h4 className="font-bold text-blue-700 bg-blue-50 p-2 rounded-lg mb-2 shadow-sm text-sm border border-blue-100">🏫 Phân hiệu Hải Sơn (Các lớp /1 - /6)</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {haiSon.map((cName) => (
                                  <div key={cName} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors text-sm shadow-sm" onClick={() => setSelectedClassForModal(cName)}>
                                    <span className="font-bold text-gray-700">Lớp {cName}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {hanMacTu.length > 0 && (
                            <div>
                              <h4 className="font-bold text-green-700 bg-green-50 p-2 rounded-lg mb-2 shadow-sm text-sm border border-green-100">🏫 Phân hiệu Hàn Mặc Tử (Các lớp /7 trở đi)</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {hanMacTu.map((cName) => (
                                  <div key={cName} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors text-sm shadow-sm" onClick={() => setSelectedClassForModal(cName)}>
                                    <span className="font-bold text-gray-700">Lớp {cName}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {other.length > 0 && (
                            <div>
                              <h4 className="font-bold text-gray-700 bg-gray-100 p-2 rounded-lg mb-2 shadow-sm text-sm border border-gray-200">🏫 Khác</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {other.map((cName) => (
                                  <div key={cName} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors text-sm shadow-sm" onClick={() => setSelectedClassForModal(cName)}>
                                    <span className="font-bold text-gray-700">Lớp {cName}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (`
content = content.replace(oldLeft, newLeft);

// Update Right Panel groups list
const oldRight = `              {/* Right: Groups List */}
              <div className="flex-1 flex flex-col space-y-4">
                <button onClick={createGroup} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700">
                  + Tạo nhóm mới
                </button>
                <div className="space-y-4 overflow-y-auto flex-1">
                  {groups.map(g => (`

const newRight = `              {/* Right: Groups List */}
              <div className="flex-1 flex flex-col space-y-4">
                {!selectedClassForModal ? (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-6 text-center h-full">
                    <Users className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium text-lg">Vui lòng chọn một lớp bên trái</p>
                    <p className="text-gray-400 text-sm mt-1">Danh sách nhóm sẽ hiển thị tương ứng theo lớp</p>
                  </div>
                ) : (
                  <>
                    <button onClick={createGroup} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 transition-colors">
                      + Tạo nhóm mới (Lớp {selectedClassForModal})
                    </button>
                    <div className="space-y-4 overflow-y-auto flex-1">
                      {groups.filter(g => g.className === selectedClassForModal || (g.members && g.members.some(m => allStudentsFromExcel.find(s => s.id === m.studentId)?.className === selectedClassForModal))).map(g => (`
content = content.replace(oldRight, newRight);

// Close the Right Panel condition tag
const oldRightClose = `                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>`
const newRightClose = `                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </>
                )}
              </div>`
content = content.replace(oldRightClose, newRightClose);

fs.writeFileSync(file, content);
console.log('UI Panels updated successfully.');
