const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const rejectLogicOld = `  socket.on('reject_bonus_request', (data) => {
    const session = sessions[data.code];
    if (!session || session.teacherSocketId !== socket.id) return;
    
    if (session.bonusRequests) {
      session.bonusRequests = session.bonusRequests.filter(id => id !== data.studentId);
      io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);
    }
  });`;

const rejectLogicNew = `  socket.on('reject_bonus_request', (data) => {
    const session = sessions[data.code];
    if (!session || session.teacherSocketId !== socket.id) return;
    
    if (session.bonusRequests) {
      session.bonusRequests = session.bonusRequests.filter(id => id !== data.studentId);
      io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);
    }
    
    if (!session.teacherRejectCount) session.teacherRejectCount = {};
    session.teacherRejectCount[data.studentId] = (session.teacherRejectCount[data.studentId] || 0) + 1;
    
    if (session.teacherRejectCount[data.studentId] >= 2) {
      const validSt = session.validStudents?.find(vs => String(vs.id) === String(data.studentId) || String(vs.systemId) === String(data.studentId));
      const primaryId = validSt ? validSt.systemId : data.studentId;
      const actualStudentId = validSt ? validSt.id : data.studentId;
      
      if (!session.studentPoints) session.studentPoints = {};
      session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) - 1;
      
      const pointsAwarded = {};
      const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === actualStudentId);
      if (onlineStudent) pointsAwarded[onlineStudent.id] = -1;
      pointsAwarded[actualStudentId] = -1;
      pointsAwarded[primaryId] = -1;
      
      const typesMap = {};
      Object.keys(pointsAwarded).forEach(k => typesMap[k] = 'TEACHER_REJECT_PENALTY');
      
      io.to(data.code).emit('points_awarded', pointsAwarded, typesMap);
      
      const leaderboard = Object.entries(session.studentPoints).map(([sysId, total]) => {
         const st = session.validStudents.find(vs => String(vs.systemId) === String(sysId));
         return { systemId: sysId, name: st ? st.name : sysId, total };
      }).sort((a, b) => (b.total - a.total));
      io.to(data.code).emit('leaderboard_updated', leaderboard);
    }
  });`;

content = content.replace(rejectLogicOld, rejectLogicNew);
fs.writeFileSync('server.js', content);
console.log('Added teacher reject penalty logic to server');
