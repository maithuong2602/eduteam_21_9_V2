const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

content = content.replace(`socket.emit('join_success', { code: data.code });`, `socket.emit('join_success', { code: data.code, realName });`);
fs.writeFileSync('server.js', content);
console.log('Added realName to join_success');
