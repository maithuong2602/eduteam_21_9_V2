const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Inside server.js, we have:
// socket.on('create_session', (data) => {
//     const code = Math.random().toString(36).substring(2, 7).toUpperCase();

const replaceLogic = `
  socket.on('create_session', (data) => {
    // Generate or get fixed code based on classId
    const classId = data.classId;
    let code = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    if (classId) {
      const fs = require('fs');
      const path = require('path');
      const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');
      try {
        let db = { classCodes: [], bonusLedgers: [] };
        if (fs.existsSync(DB_FILE)) {
           db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
        if (!db.classCodes) db.classCodes = [];
        let cc = db.classCodes.find(c => c.classId === classId);
        if (cc) {
          code = cc.code;
        } else {
          db.classCodes.push({ classId, code });
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
        }
      } catch(e) { console.error('Error with db.json', e) }
    }
`;

code = code.replace(
  /socket\.on\('create_session',\s*\(data\)\s*=>\s*\{\s*\/\/[^\n]*\n\s*const code = [^\n]*;/g,
  replaceLogic.trim()
);

fs.writeFileSync('server.js', code);
console.log('Fixed create_session in server.js');
