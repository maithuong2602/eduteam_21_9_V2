const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// The original code has:
// const studentBonusLedgers = [];

const dbIntegration = `
let studentBonusLedgers = [];
const path = require('path');
const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');

function saveLedger(ledger) {
  try {
    studentBonusLedgers.push(ledger);
    let db = { classCodes: [], bonusLedgers: [] };
    if (fs.existsSync(DB_FILE)) {
       db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    if (!db.bonusLedgers) db.bonusLedgers = [];
    db.bonusLedgers.push(ledger);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch(e) { console.error(e) }
}

try {
    if (fs.existsSync(DB_FILE)) {
       const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
       if (db.bonusLedgers) studentBonusLedgers = db.bonusLedgers;
    }
} catch(e) { console.error(e) }
`;

code = code.replace(/const studentBonusLedgers = \[\];/g, dbIntegration.trim());

// We also need to make sure everywhere `studentBonusLedgers.push(...)` is called, we call `saveLedger(...)` instead.
// Wait, I can just replace `studentBonusLedgers.push({` with `saveLedger({`
code = code.replace(/studentBonusLedgers\.push\(\{/g, 'saveLedger({');

// But wait, are there other places that modify it? Let's check.
// In export_ledgers_ready, it reads studentBonusLedgers.filter(...), which is fine since we keep the in-memory array synced.

fs.writeFileSync('server.js', code);
console.log('Integrated db.json into server.js ledgers');
