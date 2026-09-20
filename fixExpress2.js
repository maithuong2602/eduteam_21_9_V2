const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');
content = content.replace("app.all('/*', (req, res) => {", "app.use((req, res) => {");
fs.writeFileSync('server.js', content);
console.log('Fixed express with app.use');
