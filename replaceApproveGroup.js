const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const startIndex = content.indexOf(`  socket.on('approve_group_points', (data) => {`);
const endIndex = content.indexOf(`  socket.on('approve_points', (data) => {`);

if (startIndex === -1 || endIndex === -1) {
  console.log('Could not find boundaries');
  process.exit(1);
}

const newApproveGroup = `  socket.on('approve_group_points', (data) => {
    // data: { code, activityId, scores: { [groupId]: score } }
    const session = sessions[data.code];
    if (!session || session.teacherSocketId !== socket.id) return;

    const activityId = data.activityId;
    const bonusPoints = session.activityConfig?.bonusPoints || 0;
    const pointsAwarded = {};

    // Find or create activityHistory for this group activity
    if (!session.activityHistory) session.activityHistory = [];
    let historyRecord = session.activityHistory.find(h => h.name === (session.activityConfig?.name || 'HD1'));
    if (!historyRecord) {
      historyRecord = {
        slideNumber: session.activityConfig?.slideNumber,
        type: session.activityConfig?.type,
        name: session.activityConfig?.name,
        mode: session.activityConfig?.mode,
        bonusType: session.activityConfig?.bonusType,
        bonusPoints: session.activityConfig?.bonusPoints,
        pointsRecord: {},
        createdAt: Date.now()
      };
      session.activityHistory.push(historyRecord);
    }
    if (!historyRecord.pointsRecord) historyRecord.pointsRecord = {};

    for (const groupId in data.scores) {
      const scoreObj = data.scores[groupId];
      const ws = session.workspaces?.[activityId]?.[groupId];
      if (ws) {
        ws.groupScore = scoreObj; // Save GroupScore
      }

      const group = session.groups?.find(g => g.id === groupId);
      if (!group || !group.members || group.members.length === 0) continue;

      const validMembers = data.approvedMembers && data.approvedMembers[groupId] ? group.members.filter(m => data.approvedMembers[groupId].includes(m.studentId)) : group.members;

      // 1. Award regular ACTIVITY_SCORE
      validMembers.forEach(m => {
        const studentId = m.studentId;
        const validSt = session.validStudents.find(vs => String(vs.id) === String(studentId));
        const primaryId = validSt ? validSt.systemId : studentId;

        // Prevent double counting if teacher clicks Duyệt multiple times for the same group
        if (historyRecord.pointsRecord[primaryId] === undefined) {
           historyRecord.pointsRecord[primaryId] = scoreObj;
           if (!session.studentPoints) session.studentPoints = {};
           session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) + scoreObj;

           const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === studentId);
           if (onlineStudent) {
             pointsAwarded[onlineStudent.id] = (pointsAwarded[onlineStudent.id] || 0) + scoreObj; 
           }
           pointsAwarded[studentId] = (pointsAwarded[studentId] || 0) + scoreObj; 
           pointsAwarded[primaryId] = (pointsAwarded[primaryId] || 0) + scoreObj; 
        }
      });

      // 2. Award GROUP_BONUS if applicable
      const alreadyAwarded = groupBonusAwards.find(a => 
         a.sessionCode === data.code && a.activityId === activityId && a.groupId === groupId
      );

      if (!alreadyAwarded && bonusPoints > 0) {
        const awardId = 'AWD_' + Date.now() + '_' + groupId;
        groupBonusAwards.push({
          awardId, sessionCode: data.code, activityId, groupId, bonusPoints, appliedAt: Date.now()
        });

        validMembers.forEach(m => {
          const studentId = m.studentId;
          const validSt = session.validStudents.find(vs => String(vs.id) === String(studentId));
          const primaryId = validSt ? validSt.systemId : studentId;

          studentBonusLedgers.push({
            ledgerId: 'LED_' + Date.now() + '_' + studentId,
            studentId,
            sessionCode: data.code,
            activityId,
            points: bonusPoints,
            reason: 'GROUP_BONUS',
            groupId: groupId,
            createdAt: Date.now()
          });

          if (!session.studentPoints) session.studentPoints = {};
          session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) + bonusPoints;
          
          const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === studentId);
          if (onlineStudent) {
            pointsAwarded[onlineStudent.id] = (pointsAwarded[onlineStudent.id] || 0) + bonusPoints; 
          }
          pointsAwarded[studentId] = (pointsAwarded[studentId] || 0) + bonusPoints; 
          pointsAwarded[primaryId] = (pointsAwarded[primaryId] || 0) + bonusPoints; 
        });
        
        io.to(data.code).emit('group_bonus_awarded', { groupId, activityId, bonusPoints });
      }
    }

    if (Object.keys(pointsAwarded).length > 0) {
      io.to(data.code).emit('points_awarded', pointsAwarded);
      const leaderboard = Object.entries(session.studentPoints).map(([systemId, total]) => {
         const st = session.validStudents.find(vs => String(vs.systemId) === String(systemId));
         return { systemId, name: st ? st.name : systemId, total };
      }).sort((a, b) => (b.total - a.total));
      io.to(data.code).emit('leaderboard_updated', leaderboard);
    }
  });

`;

content = content.slice(0, startIndex) + newApproveGroup + content.slice(endIndex);
fs.writeFileSync('server.js', content);
console.log('Successfully replaced approve_group_points');
