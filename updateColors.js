const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// Replace text-gray-800 with text-black for the activity question text
content = content.replace('text-gray-800 whitespace-pre-wrap', 'text-black whitespace-pre-wrap font-bold');

// Replace text-gray-700 with text-black for the labels like "Chọn đáp án của bạn:", "Phân loại các mục sau:"
content = content.replace(/text-gray-700 text-lg mb-2/g, 'text-black text-lg mb-2');

// Make options black
content = content.replace(
  'border-gray-200 bg-white text-gray-700 hover:border-blue-300',
  'border-gray-300 bg-white text-black hover:border-blue-400 font-medium shadow-sm'
);

content = content.replace(
  'font-medium text-gray-700',
  'font-bold text-black'
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Updated colors in student page');
