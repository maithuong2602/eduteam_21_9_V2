const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const rejectLogic = `
  socket.on('reject_bonus_request', (data) => {
    const session = sessions[data.code];
    if (!session || session.teacherSocketId !== socket.id) return;
    
    if (session.bonusRequests) {
      session.bonusRequests = session.bonusRequests.filter(id => id !== data.studentId);
      io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);
    }
  });
`;

content = content.replace(`  socket.on('approve_individual_bonus', (data) => {`, rejectLogic + `\n  socket.on('approve_individual_bonus', (data) => {`);

fs.writeFileSync('server.js', content);
console.log('Added reject_bonus_request handler to server.js');
