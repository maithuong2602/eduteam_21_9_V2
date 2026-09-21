const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// Replace light borders and grays with darker, higher contrast variants
code = code.replace(/text-gray-800/g, "text-black font-extrabold");
code = code.replace(/border-gray-300/g, "border-gray-500");
code = code.replace(/bg-gray-50 border-2 border-gray-500/g, "bg-gray-100 border-2 border-gray-500 text-black");
code = code.replace(/bg-gray-200 py-3 font-bold text-center border-b-2 border-gray-500/g, "bg-gray-200 py-3 font-extrabold text-black text-center border-b-2 border-gray-500 text-lg");

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code);
console.log('Fixed Student UI text colors');
