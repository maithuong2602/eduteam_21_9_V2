const fs = require('fs');
const file = 'server.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '  app.use((req, res) => {',
  '  app.post(\'/api/internal/force_sync_db\', require(\'express\').json(), (req, res) => {\n    triggerAutoSave();\n    return res.json({ success: true });\n  });\n\n  app.use((req, res) => {'
);

fs.writeFileSync(file, content);
console.log('Success - server.js patched');

const libFile = 'src/lib/jsonDb.ts';
let libContent = fs.readFileSync(libFile, 'utf8');

if (!libContent.includes('force_sync_db')) {
  libContent = libContent.replace(
    '  try {\n    fs.renameSync(tmpFile, DB_FILE);\n  } catch(e) {\n    fs.copyFileSync(tmpFile, DB_FILE);\n    try { fs.unlinkSync(tmpFile); } catch(_) {}\n  }',
    '  try {\n    fs.renameSync(tmpFile, DB_FILE);\n  } catch(e) {\n    fs.copyFileSync(tmpFile, DB_FILE);\n    try { fs.unlinkSync(tmpFile); } catch(_) {}\n  }\n  // Trigger real-time Firebase sync\n  fetch(\'http://127.0.0.1:\' + (process.env.PORT || 3000) + \'/api/internal/force_sync_db\', { method: \'POST\' }).catch(() => {});'
  );
  fs.writeFileSync(libFile, libContent);
  console.log('Success - jsonDb.ts patched');
}
