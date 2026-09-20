const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// 1. Update request_bonus to broadcast to the whole room (data.code) instead of just teacher
const oldRequestBonus = `       if (!session.bonusRequests.includes(data.studentId)) {
          session.bonusRequests.push(data.studentId);
       }
       if (session.teacherSocketId) {
          io.to(session.teacherSocketId).emit('bonus_requests_updated', session.bonusRequests);
       }`;
const newRequestBonus = `       if (!session.bonusRequests.includes(data.studentId)) {
          session.bonusRequests.push(data.studentId);
       }
       io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);`;
content = content.replace(oldRequestBonus, newRequestBonus);

// 2. Do the same for approve_individual_bonus
const oldApproveInd = `    if (session.bonusRequests) {
      session.bonusRequests = session.bonusRequests.filter(id => id !== data.studentId);
      io.to(session.teacherSocketId).emit('bonus_requests_updated', session.bonusRequests);
    }`;
const newApproveInd = `    if (session.bonusRequests) {
      session.bonusRequests = session.bonusRequests.filter(id => id !== data.studentId);
      io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);
    }`;
content = content.replace(oldApproveInd, newApproveInd);

// 3. Do the same for approve_all_bonus
const oldApproveAll = `    session.bonusRequests = [];
    io.to(session.teacherSocketId).emit('bonus_requests_updated', session.bonusRequests);`;
const newApproveAll = `    session.bonusRequests = [];
    io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);`;
content = content.replace(oldApproveAll, newApproveAll);

// 4. Add cancel_bonus_request handler
const newCancelBonus = `
  socket.on('cancel_bonus_request', (data) => {
    const session = sessions[data.code];
    if (!session) return;
    
    if (session.bonusRequests) {
      session.bonusRequests = session.bonusRequests.filter(id => id !== data.studentId);
      io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);
    }
    
    if (!session.cancelHandRaiseCount) session.cancelHandRaiseCount = {};
    session.cancelHandRaiseCount[data.studentId] = (session.cancelHandRaiseCount[data.studentId] || 0) + 1;
    
    if (session.cancelHandRaiseCount[data.studentId] % 2 === 0) {
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
      Object.keys(pointsAwarded).forEach(k => typesMap[k] = 'PENALTY');
      
      io.to(data.code).emit('points_awarded', pointsAwarded, typesMap);
      
      const leaderboard = Object.entries(session.studentPoints).map(([sysId, total]) => {
         const st = session.validStudents.find(vs => String(vs.systemId) === String(sysId));
         return { systemId: sysId, name: st ? st.name : sysId, total };
      }).sort((a, b) => (b.total - a.total));
      io.to(data.code).emit('leaderboard_updated', leaderboard);
    }
  });
`;

// Insert the cancel_bonus_request handler just before approve_individual_bonus
content = content.replace(`  socket.on('approve_individual_bonus', (data) => {`, newCancelBonus + `\n  socket.on('approve_individual_bonus', (data) => {`);

fs.writeFileSync('server.js', content);
console.log('Updated server.js for cancel hand raise');
