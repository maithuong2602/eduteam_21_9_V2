const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const oldRequestBonus = `  socket.on('request_bonus', (data) => {
    const session = sessions[data.code];
    if (session && session.teacherSocketId) {
       io.to(session.teacherSocketId).emit('student_requested_bonus', data.studentId);
    }
  });`;

const newRequestBonus = `  socket.on('request_bonus', (data) => {
    const session = sessions[data.code];
    if (session) {
       if (!session.bonusRequests) session.bonusRequests = [];
       if (!session.bonusRequests.includes(data.studentId)) {
          session.bonusRequests.push(data.studentId);
       }
       if (session.teacherSocketId) {
          io.to(session.teacherSocketId).emit('bonus_requests_updated', session.bonusRequests);
       }
    }
  });`;

content = content.replace(oldRequestBonus, newRequestBonus);

const oldApproveInd = `    io.to(data.code).emit('leaderboard_updated', leaderboard);
    io.to(session.teacherSocketId).emit('history_updated', session.activityHistory);
  });`;

const newApproveInd = `    io.to(data.code).emit('leaderboard_updated', leaderboard);
    io.to(session.teacherSocketId).emit('history_updated', session.activityHistory);

    if (session.bonusRequests) {
      session.bonusRequests = session.bonusRequests.filter(id => id !== data.studentId);
      io.to(session.teacherSocketId).emit('bonus_requests_updated', session.bonusRequests);
    }
  });

  socket.on('approve_all_bonus', (data) => {
    const session = sessions[data.code];
    if (!session || session.teacherSocketId !== socket.id) return;
    
    if (!session.bonusRequests) return;
    const bonusPoints = 1;
    
    if (!session.studentPoints) session.studentPoints = {};
    const pointsAwarded = {};
    
    session.bonusRequests.forEach(studentId => {
      const validSt = session.validStudents?.find(vs => String(vs.id) === String(studentId) || String(vs.systemId) === String(studentId));
      const primaryId = validSt ? validSt.systemId : studentId;
      const actualStudentId = validSt ? validSt.id : studentId;

      session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) + bonusPoints;
      
      studentBonusLedgers.push({
        ledgerId: 'LED_' + Date.now() + '_' + actualStudentId,
        studentId: actualStudentId,
        sessionCode: data.code,
        activityId: 'HAND_RAISE',
        points: bonusPoints,
        reason: 'INDIVIDUAL_BONUS',
        groupId: null,
        createdAt: Date.now()
      });

      const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === actualStudentId);
      if (onlineStudent) {
        pointsAwarded[onlineStudent.id] = bonusPoints;
      }
      pointsAwarded[actualStudentId] = bonusPoints;
      pointsAwarded[primaryId] = bonusPoints;
    });

    // Send one big points_awarded payload!
    io.to(data.code).emit('points_awarded', pointsAwarded, {});

    const leaderboard = Object.entries(session.studentPoints).map(([sysId, total]) => {
       const st = session.validStudents.find(vs => String(vs.systemId) === String(sysId));
       return { systemId: sysId, name: st ? st.name : sysId, total };
    }).sort((a, b) => (b.total - a.total));
    io.to(data.code).emit('leaderboard_updated', leaderboard);

    session.bonusRequests = [];
    io.to(session.teacherSocketId).emit('bonus_requests_updated', session.bonusRequests);
  });`;

content = content.replace(oldApproveInd, newApproveInd);

fs.writeFileSync('server.js', content);
console.log('Updated server state management for bonusRequests');
