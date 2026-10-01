const fs = require('fs');
const file = 'server.js';
let content = fs.readFileSync(file, 'utf8');

// Move studentBonusLedgers declaration UP
content = content.replace('let studentBonusLedgers = [];', '');
content = content.replace('const groupBonusAwards = [];', 'const groupBonusAwards = [];\nlet studentBonusLedgers = [];');

// Add lastLedgersStr sync to Firebase init
content = content.replace(
  'lastSessionsStr = JSON.stringify(sessions);\n                }',
  'lastSessionsStr = JSON.stringify(sessions);\n                }\n                lastLedgersStr = JSON.stringify(studentBonusLedgers);'
);

fs.writeFileSync(file, content);
console.log('Success - patched ReferenceError');
