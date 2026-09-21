const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

// Fix Group Name Input
content = content.replace(
  'className="font-bold text-lg mb-2 border-b border-dashed border-gray-300 bg-transparent focus:outline-none focus:border-indigo-500 w-full"',
  'className="font-bold text-lg mb-2 border-b border-dashed border-gray-300 bg-transparent focus:outline-none focus:border-indigo-500 w-full text-black placeholder-gray-500"'
);

// Fix Student Name tag
content = content.replace(
  'className="bg-white border border-gray-300 px-2 py-1 rounded-md text-xs shadow-sm flex items-center"',
  'className="bg-white border border-gray-300 px-2 py-1 rounded-md text-xs font-semibold text-black shadow-sm flex items-center"'
);

// Fix Select Class dropdown
content = content.replace(
  'className="border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 py-2 pl-3 pr-8 border outline-none"',
  'className="border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 py-2 pl-3 pr-8 border outline-none text-black font-bold"'
);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Updated colors in teacher page');
