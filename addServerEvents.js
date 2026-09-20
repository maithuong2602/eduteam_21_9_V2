const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const newEvents = `
  socket.on('request_bonus', (data) => {
    const session = sessions[data.code];
    if (session && session.teacherSocketId) {
       io.to(session.teacherSocketId).emit('student_requested_bonus', data.studentId);
    }
  });

  socket.on('approve_individual_bonus', (data) => {
    // data: { code, studentId, points }
    const session = sessions[data.code];
    if (!session || session.teacherSocketId !== socket.id) return;
    
    const studentId = data.studentId;
    const bonusPoints = data.points || 1;
    
    const validSt = session.validStudents?.find(vs => String(vs.id) === String(studentId) || String(vs.systemId) === String(studentId));
    const primaryId = validSt ? validSt.systemId : studentId;
    const actualStudentId = validSt ? validSt.id : studentId;

    if (!session.studentPoints) session.studentPoints = {};
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

    const pointsAwarded = {};
    const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === actualStudentId);
    if (onlineStudent) {
      pointsAwarded[onlineStudent.id] = bonusPoints;
    }
    pointsAwarded[actualStudentId] = bonusPoints;
    pointsAwarded[primaryId] = bonusPoints;

    io.to(data.code).emit('points_awarded', pointsAwarded);
    
    const leaderboard = Object.entries(session.studentPoints).map(([sysId, total]) => {
       const st = session.validStudents.find(vs => String(vs.systemId) === String(sysId));
       return { systemId: sysId, name: st ? st.name : sysId, total };
    }).sort((a, b) => (b.total - a.total));
    io.to(data.code).emit('leaderboard_updated', leaderboard);
  });
`;

const insertIndex = content.indexOf(`  socket.on('disconnect'`);
if (insertIndex !== -1) {
  content = content.slice(0, insertIndex) + newEvents + content.slice(insertIndex);
  fs.writeFileSync('server.js', content);
  console.log('Added request_bonus and approve_individual_bonus to server.js');
}
