const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const startIdx = content.indexOf('<style>');
const endIdx = content.indexOf('</style>') + 8; // length of </style>

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + content.slice(endIdx);
  // Also clean up any extra whitespace before className=
  content = content.replace(/<div\s+className="/, '<div className="');
}

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Removed broken style block');
