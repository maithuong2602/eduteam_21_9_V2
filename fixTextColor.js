const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

code = code.replace(
  'className="w-full p-4 rounded-xl border-2 text-lg transition-all border-gray-300 focus:border-blue-500 outline-none disabled:opacity-50"',
  'className="w-full p-4 rounded-xl border-2 text-lg font-medium text-black bg-white transition-all border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:opacity-50 disabled:bg-gray-100"'
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code);
console.log('Fixed text color for textarea');
