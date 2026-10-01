const fs = require('fs');
const file = 'server.js';
let content = fs.readFileSync(file, 'utf8');

// Fix isAutoSaving to wait for setDoc promise
const oldAutoSaveBlock = `         isAutoSaving = true;
         fs.writeFile(tmpFile, JSON.stringify(db, null, 2), "utf8", (err) => {
              try {
                 const { firestore, doc, setDoc } = require("./firebase.js");
                 setDoc(doc(firestore, "system", "db"), db).catch(e => console.error("Firebase sync error:", e));
              } catch(e) {}
            isAutoSaving = false;
            if (err) return console.error('Auto-save error:', err);
            try {
               fs.renameSync(tmpFile, DB_FILE);
            } catch(e) {
               fs.copyFileSync(tmpFile, DB_FILE);
               try { fs.unlinkSync(tmpFile); } catch(_) {}
            }
         });`;

const newAutoSaveBlock = `         isAutoSaving = true;
         fs.writeFile(tmpFile, JSON.stringify(db, null, 2), "utf8", (err) => {
              if (err) {
                  isAutoSaving = false;
                  return console.error('Auto-save error:', err);
              }
              try {
                 fs.renameSync(tmpFile, DB_FILE);
              } catch(e) {
                 fs.copyFileSync(tmpFile, DB_FILE);
                 try { fs.unlinkSync(tmpFile); } catch(_) {}
              }
              
              try {
                 const { firestore, doc, setDoc } = require("./firebase.js");
                 setDoc(doc(firestore, "system", "db"), db)
                   .then(() => {
                       isAutoSaving = false;
                   })
                   .catch(e => {
                       console.error("Firebase sync error:", e);
                       isAutoSaving = false;
                   });
              } catch(e) {
                  isAutoSaving = false;
              }
         });`;

content = content.replace(oldAutoSaveBlock, newAutoSaveBlock);

// Fix the /api/internal/force_sync_db endpoint to avoid ReferenceError
content = content.replace(
  'triggerAutoSave();',
  '// no-op, let the 3s interval handle it reliably now'
);

fs.writeFileSync(file, content);
console.log('Success - patched isAutoSaving');
