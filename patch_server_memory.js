const fs = require('fs');
const file = 'server.js';
let content = fs.readFileSync(file, 'utf8');

const target = `fs.writeFileSync(DB_FILE, JSON.stringify(snap.data(), null, 2), "utf8");
              console.log("Firebase DB downloaded and cached locally.");`;

const replacement = `fs.writeFileSync(DB_FILE, JSON.stringify(snap.data(), null, 2), "utf8");
              console.log("Firebase DB downloaded and cached locally.");
              
              // Reload memory state from the newly downloaded DB
              const newDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
              if (newDb.bonusLedgers) studentBonusLedgers = newDb.bonusLedgers;
              if (newDb.activeSessions) {
                 sessions = newDb.activeSessions;
                 lastSessionsStr = JSON.stringify(sessions);
              }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log("Success");
} else {
    console.log("Not found");
}
