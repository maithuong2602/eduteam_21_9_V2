const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/db.json', 'utf8'));
console.log(JSON.stringify(data.presentations, null, 2));
