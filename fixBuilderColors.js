const fs = require('fs');
let code = fs.readFileSync('src/components/ClassificationBuilder.tsx', 'utf8');

// Force dark text colors everywhere in PREVIEW
code = code.replace(/text-xl font-bold text-center mb-8/g, "text-xl font-bold text-center mb-8 text-black");
code = code.replace(/bg-white border-2 border-gray-300 px-4 py-2 rounded-lg shadow-sm font-medium cursor-grab hover:border-blue-400 hover:shadow-md transition-all/g, "bg-white border-2 border-gray-400 px-4 py-2 rounded-lg shadow-sm font-bold text-black cursor-grab hover:border-blue-500 hover:shadow-md transition-all");
code = code.replace(/bg-gray-200 py-3 font-bold text-center border-b-2 border-gray-300 rounded-t-lg/g, "bg-gray-200 py-3 font-extrabold text-center border-b-2 border-gray-400 rounded-t-lg text-black");
code = code.replace(/w-64 bg-gray-50 border-2 border-gray-300 rounded-xl min-h-\[250px\] flex flex-col shadow-sm/g, "w-64 bg-gray-100 border-2 border-gray-400 rounded-xl min-h-[250px] flex flex-col shadow-sm text-black");

fs.writeFileSync('src/components/ClassificationBuilder.tsx', code);
console.log('Fixed ClassificationBuilder text colors');
