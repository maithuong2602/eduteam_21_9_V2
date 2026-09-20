const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const staticServe = `
  const path = require('path');
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
`;

content = content.replace("app.use(cors());", "app.use(cors());\n" + staticServe);
fs.writeFileSync('server.js', content);
console.log('Added express.static for /uploads');
