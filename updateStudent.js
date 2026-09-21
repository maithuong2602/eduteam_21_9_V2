const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const regex = /\{activity\.type === "CLASSIFICATION" && \([\s\S]*?<\/div>\s*\)\}/;

const newClassificationUI = `{activity.type === "CLASSIFICATION" && (() => {
            // Migration for legacy structure
            const isLegacy = Array.isArray(activity.items) && typeof activity.items[0] === 'string';
            
            const items = isLegacy 
              ? activity.items.map((str: string, idx: number) => ({ id: str, text: str }))
              : (activity.items || []);
              
            const groups = isLegacy && activity.categories
              ? activity.categories.map((c: string, idx: number) => ({ id: c, name: c }))
              : (activity.groups || []);

            // Derive uncategorized items
            const uncategorizedItems = items.filter((item: any) => !workspaceState[item.id]);

            return (
              <div className="space-y-6">
                <h3 className="font-semibold text-black text-xl mb-4 text-center">Kéo thả các mục vào đúng nhóm</h3>
                
                {/* Uncategorized Pool */}
                <div 
                  className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-4 min-h-[120px] flex flex-wrap gap-3 items-center justify-center transition-colors"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (isLocked || submitted) return;
                    const itemId = e.dataTransfer.getData('itemId');
                    if (itemId && activity.settings?.allowMoveBack !== false) {
                      // Move back to uncategorized by setting its state to null
                      handleWorkspaceChange(itemId, null);
                    }
                  }}
                >
                  {uncategorizedItems.length === 0 ? (
                    <span className="text-gray-400 italic">Đã phân loại hết</span>
                  ) : (
                    uncategorizedItems.map((item: any) => (
                      <div 
                        key={item.id}
                        draggable={!isLocked && !submitted}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('itemId', item.id);
                        }}
                        className={\`bg-white border-2 border-blue-400 px-4 py-2 rounded-lg shadow-sm font-bold text-gray-800 \${!isLocked && !submitted ? 'cursor-grab hover:shadow-md hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'} transition-all\`}
                      >
                        {item.text}
                      </div>
                    ))
                  )}
                </div>

                {/* Drop Zones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  {groups.map((group: any) => {
                    const groupItems = items.filter((item: any) => workspaceState[item.id] === group.id);
                    return (
                      <div 
                        key={group.id}
                        className="bg-gray-50 border-2 border-gray-300 rounded-xl overflow-hidden flex flex-col shadow-sm"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          if (isLocked || submitted) return;
                          const itemId = e.dataTransfer.getData('itemId');
                          if (itemId) {
                            handleWorkspaceChange(itemId, group.id);
                          }
                        }}
                      >
                        <div className="bg-gray-200 py-3 font-bold text-center border-b-2 border-gray-300 text-gray-800">
                          {group.name}
                        </div>
                        <div className="flex-1 p-4 flex flex-col gap-2 min-h-[150px]">
                          {groupItems.map((item: any) => (
                            <div 
                              key={item.id}
                              draggable={!isLocked && !submitted && activity.settings?.allowMoveBack !== false}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('itemId', item.id);
                              }}
                              className={\`bg-white border-2 border-gray-300 px-3 py-2 rounded text-gray-800 shadow-sm font-medium \${(!isLocked && !submitted && activity.settings?.allowMoveBack !== false) ? 'cursor-grab hover:border-blue-400' : ''}\`}
                            >
                              {item.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activity?.mode !== "GROUP" && (
                  <button
                    onClick={handleSubmit}
                    disabled={uncategorizedItems.length > 0 || submitted || isLocked}
                    className={\`w-full py-4 rounded-xl font-bold text-lg text-white flex items-center justify-center mt-6 transition-all \${
                      submitted ? "bg-green-500" : isLocked ? "bg-red-500 cursor-not-allowed" : uncategorizedItems.length === 0 ? "bg-blue-600 hover:bg-blue-700 shadow-md transform hover:-translate-y-1" : "bg-gray-300 cursor-not-allowed"
                    }\`}
                  >
                    {submitted ? "Đã Nộp" : isLocked ? "Đã Khóa" : uncategorizedItems.length > 0 ? \`Còn \${uncategorizedItems.length} mục chưa phân loại\` : "Nộp bài"}
                  </button>
                )}
              </div>
            );
          })()}`;

code = code.replace(regex, newClassificationUI);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code);
console.log('Successfully updated student Classification UI');
