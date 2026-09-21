const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Replace all strict teacherSocketId checks to allow reclaiming the session
// Basically, we just trust that if someone emits 'change_slide' or 'start_activity', they are the teacher.

code = code.replace(
  /if \(session && session\.teacherSocketId === socket\.id\) \{/g,
  `if (session) {
        // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
        if (session.teacherSocketId !== socket.id) {
            session.teacherSocketId = socket.id;
        }`
);

// We should also replace the !session || session.teacherSocketId !== socket.id checks
code = code.replace(
  /if \(!session \|\| session\.teacherSocketId !== socket\.id\) return;/g,
  `if (!session) return;
      if (session.teacherSocketId !== socket.id) session.teacherSocketId = socket.id;`
);

fs.writeFileSync('server.js', code);
console.log('Relaxed teacherSocketId checks to handle reconnections');
