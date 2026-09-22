const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// Replace group div to add onClick
code = code.replace(
  /className="bg-gray-100 border-2 border-gray-500 text-black rounded-xl overflow-hidden flex flex-col shadow-sm"\s+onDragOver=\{e => e\.preventDefault\(\)\}\s+onDrop=\{e => \{/g,
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

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code, 'utf8');
