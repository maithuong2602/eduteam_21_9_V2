const fs = require('fs');

const fixOptions = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/<option/g, '<option className="text-black bg-white font-bold"');
  // cleanup duplicate classNames if any
  content = content.replace(/className="text-black bg-white font-bold" value="" className="text-black bg-white font-bold"/g, 'value="" className="text-black bg-white font-bold"');
  content = content.replace(/className="text-black bg-white font-bold" key=\{c.id\} value=\{c.id\} className="text-black bg-white font-bold"/g, 'key={c.id} value={c.id} className="text-black bg-white font-bold"');
  
  fs.writeFileSync(filePath, content);
};

fixOptions('src/app/student/[sessionCode]/page.tsx');
fixOptions('src/app/teacher/presentations/[id]/page.tsx');
console.log('Fixed all options');
