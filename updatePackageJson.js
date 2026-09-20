const fs = require('fs');
let content = fs.readFileSync('package.json', 'utf8');
content = content.replace('"dev": "next dev"', '"dev": "node server.js"');
fs.writeFileSync('package.json', content);
console.log('Updated package.json');
