const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

// Fix sidebar student name
content = content.replace(
  '<span className="font-medium text-sm">{s.name}</span>',
  '<span className="font-bold text-black text-sm">{s.name}</span>'
);

// Fix group modal left sidebar class name
content = content.replace(
  '<span className="font-bold text-gray-700">Lớp {cName}</span>',
  '<span className="font-bold text-black">Lớp {cName}</span>'
);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Fixed more colors');
