const fs = require('fs');
let code = fs.readFileSync('src/components/layout/TeacherSidebar.tsx', 'utf8');

// The file currently has:
// <div className="p-4 border-t border-gray-200">
//         
//       <div className="p-4 border-t border-gray-200">
// We just need to replace the double div with a single div

code = code.replace(
  '<div className="p-4 border-t border-gray-200">\r\n        \r\n      <div className="p-4 border-t border-gray-200">',
  '<div className="p-4 border-t border-gray-200">'
);
code = code.replace(
  '<div className="p-4 border-t border-gray-200">\n        \n      <div className="p-4 border-t border-gray-200">',
  '<div className="p-4 border-t border-gray-200">'
);

fs.writeFileSync('src/components/layout/TeacherSidebar.tsx', code);
console.log("Fixed HTML structure");
