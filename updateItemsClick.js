const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// For Uncategorized Item
code = code.replace(
  /onDragStart=\{\(e\) => \{\s*e\.dataTransfer\.setData\('itemId', item\.id\);\s*\}\}\s*className=\{`bg-white border-2 border-blue-400([^`]*)`\}/g,
  `onDragStart={(e) => {
                            e.dataTransfer.setData('itemId', item.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isLocked || submitted) return;
                            setSelectedItemId(prev => prev === item.id ? null : item.id);
                          }}
                          className={\`bg-white border-2 border-blue-400$1 \${selectedItemId === item.id ? 'ring-4 ring-yellow-400 bg-yellow-50 scale-105' : ''}\`}`
);

// For Grouped Item
code = code.replace(
  /onDragStart=\{\(e\) => \{\s*e\.dataTransfer\.setData\('itemId', item\.id\);\s*\}\}\s*className=\{`bg-white border-2 border-gray-500([^`]*)`\}/g,
  `onDragStart={(e) => {
                                  e.dataTransfer.setData('itemId', item.id);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isLocked || submitted || activity.settings?.allowMoveBack === false) return;
                                  setSelectedItemId(prev => prev === item.id ? null : item.id);
                                }}
                                className={\`bg-white border-2 border-gray-500$1 \${selectedItemId === item.id ? 'ring-4 ring-yellow-400 bg-yellow-50 scale-105' : ''}\`}`
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code, 'utf8');
