const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// select category
content = content.replace(
  '<select\n                    className="w-full p-4 rounded-xl border-2 text-lg transition-all border-gray-300 focus:border-blue-500 outline-none text-black font-bold"',
  '<select style={{ color: "#000", fontWeight: "bold", backgroundColor: "#fff" }} className="w-full p-4 rounded-xl border-2 text-lg transition-all border-gray-300 focus:border-blue-500 outline-none text-black font-bold"'
);
content = content.replace(
  '<option className="text-black bg-white font-bold" value="">',
  '<option style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold" value="">'
);
content = content.replace(
  '<option className="text-black bg-white font-bold" key={cat} value={cat}>',
  '<option style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold" key={cat} value={cat}>'
);

// select group
content = content.replace(
  '<select\n                className="w-full p-3 border-2 border-indigo-100 rounded-lg bg-white mb-3 text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-300 outline-none transition-all"',
  '<select style={{ color: "#000", fontWeight: "bold", backgroundColor: "#fff" }} className="w-full p-3 border-2 border-indigo-100 rounded-lg bg-white mb-3 text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-300 outline-none transition-all"'
);
content = content.replace(
  '<option className="text-black bg-white font-bold" value="" disabled>',
  '<option style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold" value="" disabled>'
);
content = content.replace(
  '<option className="text-black bg-white font-bold" key={g.id} value={g.id}>',
  '<option style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold" key={g.id} value={g.id}>'
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Added inline styles to student ui');
