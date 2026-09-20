const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.start = "NODE_ENV=production node server.js";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Added start script for production');
