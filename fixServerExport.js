const fs = require('fs');
let serverContent = fs.readFileSync('server.js', 'utf8');

const oldExport = `       socket.emit('export_ledgers_ready', {
          ledgers,
          history: session.activityHistory || [],
          studentPoints: session.studentPoints || {}
       });`;
const newExport = `       socket.emit('export_ledgers_ready', {
          ledgers,
          history: session.activityHistory || [],
          studentPoints: session.studentPoints || {},
          validStudents: session.validStudents || []
       });`;
       
serverContent = serverContent.replace(oldExport, newExport);
fs.writeFileSync('server.js', serverContent);
console.log('Fixed server.js export_ledgers_ready payload');
