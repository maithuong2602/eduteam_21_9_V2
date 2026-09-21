const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(
  'let studentBonusLedgers = [];\nconst path = require(\'path\');',
  'let studentBonusLedgers = [];'
);
code = code.replace(
  'let studentBonusLedgers = [];\r\nconst path = require(\'path\');',
  'let studentBonusLedgers = [];'
);

fs.writeFileSync('server.js', code);
console.log('Fixed path redeclaration');
