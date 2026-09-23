const fs = require('fs'); module.exports = (msg) => fs.appendFileSync('debug_approve.log', msg + '\n');
