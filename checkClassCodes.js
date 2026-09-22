const fs = require('fs');
const db = JSON.parse(fs.readFileSync('src/data/db.json', 'utf8'));
console.log(JSON.stringify(db.classCodes, null, 2));
