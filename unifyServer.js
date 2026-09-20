const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');

let coreLogic = lines.slice(15, 702).join('\n');

const newServer = `const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  app.use(cors());
  const server = http.createServer(app);
  
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

` + coreLogic + `

  app.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(\`> Ready on http://localhost:\${PORT} (Next.js + Socket.io Unified)\`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
`;

fs.writeFileSync('server.js', newServer);
console.log('Unified server.js created');
