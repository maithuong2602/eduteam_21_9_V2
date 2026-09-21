const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(
  "socket.on('change_slide', (data) => {",
  "socket.on('change_slide', (data) => {\n      console.log(`Teacher requested change_slide: ${data.slideNumber} for ${data.code}`);"
);

fs.writeFileSync('server.js', code);
console.log('Added logging to change_slide');
