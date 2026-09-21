const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

// Force style on select
content = content.replace(
  '<select \n                className="border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 py-2 pl-3 pr-8 border outline-none text-black font-bold"',
  '<select style={{ color: "#000", fontWeight: "bold", backgroundColor: "#fff" }} className="border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 py-2 pl-3 pr-8 border outline-none text-black font-bold"'
);

// Force style on the default option
content = content.replace(
  '<option value="" className="text-black bg-white font-bold">',
  '<option value="" style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold">'
);

// Force style on map option
content = content.replace(
  '<option key={c.id} value={c.id} className="text-black bg-white font-bold">',
  '<option key={c.id} value={c.id} style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold">'
);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Added inline styles');
