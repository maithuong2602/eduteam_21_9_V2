const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

content = content.replace(
  '<option value="">-- Chọn lớp học --</option>',
  '<option value="" className="text-black bg-white font-bold">-- Chọn lớp học --</option>'
);

content = content.replace(
  '<option key={c.id} value={c.id}>{c.name} ({c.studentCount} HS)</option>',
  '<option key={c.id} value={c.id} className="text-black bg-white font-bold">{c.name} ({c.studentCount} HS)</option>'
);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Added text-black to options');
