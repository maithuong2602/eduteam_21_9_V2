const fs = require('fs');
let code = fs.readFileSync('tests/global-setup.ts', 'utf8');
code = code.replace(/slideNumber: 3,/g, 'slideId: 3,');
fs.writeFileSync('tests/global-setup.ts', code, 'utf8');
