const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const oldConfig = `        bonusType: data.bonusType || 'NONE',
        bonusPoints: data.bonusPoints || 0,
        options: data.options,`;
const newConfig = `        bonusType: data.bonusType || 'NONE',
        bonusPoints: data.bonusPoints || 0,
        endTime: data.endTime || null,
        options: data.options,`;

content = content.replace(oldConfig, newConfig);
fs.writeFileSync('server.js', content);
console.log('Added endTime to server.js');
