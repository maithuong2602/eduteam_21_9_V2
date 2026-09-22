const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// 1. Add state
code = code.replace(
  'const [workspaceStatus, setWorkspaceStatus] = useState("WORKING");',
  'const [workspaceStatus, setWorkspaceStatus] = useState("WORKING");\n  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);'
);

// 2. Uncategorized pool click
code = code.replace(
  'onDrop={e => {',
  `onClick={() => {
                      if (!isLocked && !submitted && selectedItemId && activity.settings?.allowMoveBack !== false) {
                        handleWorkspaceChange(selectedItemId, null);
                        setSelectedItemId(null);
                      }
                    }}
                    onDrop={e => {`
);

// 3. Uncategorized item click and style
code = code.replace(
  `onDragStart={(e) => {
                            e.dataTransfer.setData('itemId', item.id);
                          }}
                          className={\`bg-white border-2 border-blue-400 px-4 py-2 rounded-lg shadow-sm font-bold text-black font-extrabold \${!isLocked && !submitted ? 'cursor-grab hover:shadow-md hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'} transition-all\`}`,
  `onDragStart={(e) => {
                            e.dataTransfer.setData('itemId', item.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isLocked || submitted) return;
                            setSelectedItemId(prev => prev === item.id ? null : item.id);
                          }}
                          className={\`bg-white border-2 border-blue-400 px-4 py-2 rounded-lg shadow-sm font-bold text-black font-extrabold \${!isLocked && !submitted ? 'cursor-grab hover:shadow-md hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'} \${selectedItemId === item.id ? 'ring-4 ring-yellow-400 bg-yellow-50 scale-105' : ''} transition-all\`}`
);

// 4. Group zone click
code = code.replace(
  `className="bg-gray-100 border-2 border-gray-500 text-black rounded-xl overflow-hidden flex flex-col shadow-sm"
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {`,
  `className="bg-gray-100 border-2 border-gray-500 text-black rounded-xl overflow-hidden flex flex-col shadow-sm cursor-pointer"
                          onClick={() => {
                             if (!isLocked && !submitted && selectedItemId) {
                                handleWorkspaceChange(selectedItemId, group.id);
                                setSelectedItemId(null);
                             }
                          }}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {`
);

// 5. Grouped item click and style
code = code.replace(
  `onDragStart={(e) => {
                                  e.dataTransfer.setData('itemId', item.id);
                                }}
                                className={\`bg-white border-2 border-gray-500 px-3 py-2 rounded text-black font-extrabold shadow-sm font-medium \${(!isLocked && !submitted && activity.settings?.allowMoveBack !== false) ? 'cursor-grab hover:border-blue-400' : ''}\`}`,
  `onDragStart={(e) => {
                                  e.dataTransfer.setData('itemId', item.id);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isLocked || submitted || activity.settings?.allowMoveBack === false) return;
                                  setSelectedItemId(prev => prev === item.id ? null : item.id);
                                }}
                                className={\`bg-white border-2 border-gray-500 px-3 py-2 rounded text-black font-extrabold shadow-sm font-medium \${(!isLocked && !submitted && activity.settings?.allowMoveBack !== false) ? 'cursor-grab hover:border-blue-400' : ''} \${selectedItemId === item.id ? 'ring-4 ring-yellow-400 bg-yellow-50 scale-105' : ''}\`}`
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code, 'utf8');
