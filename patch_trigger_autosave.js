const fs = require('fs');
const file = 'server.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'setInterval(() => {\n    if (isAutoSaving) return;',
  'function triggerAutoSave() {\n    if (isAutoSaving) return;'
);

content = content.replace(
  '       console.error("Auto-save error:", e);\n    }\n  }, 10000);',
  '       console.error("Auto-save error:", e);\n    }\n  }\n  setInterval(triggerAutoSave, 10000);'
);

content = content.replace(
  'saveLedger(ledger);\n    });',
  'saveLedger(ledger);\n    });\n    triggerAutoSave();'
);

content = content.replace(
  'saveLedger(ledger);\n      io.to(session.teacherSocketId).emit(\'points_awarded\'',
  'saveLedger(ledger);\n      triggerAutoSave();\n      io.to(session.teacherSocketId).emit(\'points_awarded\''
);

fs.writeFileSync(file, content);
console.log('Success');
