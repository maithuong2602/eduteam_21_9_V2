const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
const testDbPath = path.join(process.cwd(), 'src', 'data', 'db.test.json');

function backupAndCount(file) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, file + '.bak');
    const db = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`Backup successful for ${file}`);
    console.log(`- Presentations: ${db.presentations?.length || 0}`);
    console.log(`- Activities: ${db.activities?.length || 0}`);
  } else {
    console.log(`${file} does not exist.`);
  }
}

backupAndCount(dbPath);
backupAndCount(testDbPath);
