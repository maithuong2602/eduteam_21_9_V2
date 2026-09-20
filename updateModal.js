const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add State
if (!content.includes('selectedClassForModal')) {
    content = content.replace(
        'const [showGroupModal, setShowGroupModal] = useState(false);',
        'const [showGroupModal, setShowGroupModal] = useState(false);\n  const [selectedClassForModal, setSelectedClassForModal] = useState<string | null>(null);'
    );
}

// 2. Replace Left Panel
const searchBlock =               {/* Left: Students List */}
              <div className=\"flex-1 border rounded-xl overflow-hidden flex flex-col\">
                <div className=\"bg-gray-100 p-3 border-b font-bold text-gray-700\">Danh sách học sinh</div>
                <div className=\"p-3 flex-1 overflow-y-auto space-y-2\">
                  {allStudentsFromExcel.map((s: any) => {
                    const studentGroup = groups.find(g => g.members.some((m: any) => m.studentId === s.id));
                    if (studentGroup) return null; // Hide assigned students from list
                    return (
                      <div key={s.id} className=\"flex items-center justify-between p-2 border rounded hover:bg-gray-50\">
                        <div className=\"flex items-center\">
                          <span className=\"font-medium text-sm\">{s.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (activeGroupId) assignStudentToGroup(s.id, activeGroupId);
                            else alert(\"Vui lòng click chọn một nhóm ở cột bên phải trước khi thêm học sinh!\");
                          }}
                          className=\"bg-indigo-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-indigo-700 shadow-sm\"
                        >
                          Đưa vào nhóm
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>;

const replaceBlock =               {/* Left: Students List */}
              <div className="flex-1 border rounded-xl overflow-hidden flex flex-col">
                <div className="bg-gray-100 p-3 border-b font-bold text-gray-700 flex justify-between items-center">
                  Danh sách học sinh
                  {selectedClassForModal && (
                    <button onClick={() => setSelectedClassForModal(null)} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">
                      Quay lại chọn lớp
                    </button>
                  )}
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-2">
                  {!selectedClassForModal ? (
                    // Show classes list
                    Array.from(new Set(allStudentsFromExcel.map(s => s.className).filter(Boolean))).map((cName: string) => (
                      <div key={cName} className="flex items-center justify-between p-3 border rounded-lg hover:bg-indigo-50 cursor-pointer" onClick={() => setSelectedClassForModal(cName as string)}>
                        <span className="font-medium text-gray-800">Lớp {cName}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))
                  ) : (
                    // Show students in class
                    allStudentsFromExcel.filter(s => s.className === selectedClassForModal).map((s: any) => {
                      const studentGroup = groups.find(g => g.members.some((m: any) => m.studentId === s.id));
                      if (studentGroup) return null; // Hide assigned students from list
                      return (
                        <div key={s.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                          <div className="flex items-center">
                            <span className="font-medium text-sm">{s.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (activeGroupId) assignStudentToGroup(s.id, activeGroupId);
                              else alert("Vui lòng click chọn một nhóm ở cột bên phải trước khi thêm học sinh!");
                            }}
                            className="bg-indigo-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-indigo-700 shadow-sm"
                          >
                            Đưa vào nhóm
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>;

content = content.replace(searchBlock, replaceBlock);

fs.writeFileSync(file, content);
console.log('UI Updated');
