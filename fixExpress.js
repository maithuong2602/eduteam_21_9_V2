const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');
content = content.replace("app.all('*', (req, res) => {", "app.all('*', (req, res) => {");
content = content.replace("app.all('*', (req, res) => {", "app.all('/*', (req, res) => {");
fs.writeFileSync('server.js', content);
console.log('Fixed express wildcard');
