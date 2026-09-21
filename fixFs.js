const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(
  'try {\r\n    if (fs.existsSync(DB_FILE)) {',
  'const fs = require("fs");\r\ntry {\r\n    if (fs.existsSync(DB_FILE)) {'
);
code = code.replace(
  'try {\n    if (fs.existsSync(DB_FILE)) {',
  'const fs = require("fs");\ntry {\n    if (fs.existsSync(DB_FILE)) {'
);

fs.writeFileSync('server.js', code);
console.log('Fixed fs reference');
