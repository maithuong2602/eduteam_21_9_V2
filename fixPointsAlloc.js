const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const oldMembersIter = `           const validMembers = data.approvedMembers && data.approvedMembers[groupId] ? group.members.filter(m => data.approvedMembers[groupId].includes(m.studentId)) : group.members;
           validMembers.forEach(m => {
             const studentId = m.studentId;
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
             session.studentPoints[studentId] = (session.studentPoints[studentId] || 0) + bonusPoints;
             pointsAwarded[studentId] = bonusPoints;
           });`;

const newMembersIter = `           const validMembers = data.approvedMembers && data.approvedMembers[groupId] ? group.members.filter(m => data.approvedMembers[groupId].includes(m.studentId)) : group.members;
           validMembers.forEach(m => {
             const studentId = m.studentId;
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

             const validSt = session.validStudents.find(vs => String(vs.id) === String(studentId));
             const primaryId = validSt ? validSt.systemId : studentId;
             
             if (!session.studentPoints) session.studentPoints = {};
             session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) + bonusPoints;
             
             // Send points_awarded using socket.id if online, otherwise fallback to both IDs
             const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === studentId);
             if (onlineStudent) {
               pointsAwarded[onlineStudent.id] = bonusPoints; // socket.id
             }
             pointsAwarded[studentId] = bonusPoints; // HS001
             pointsAwarded[primaryId] = bonusPoints; // 78129
           });`;

content = content.replace(oldMembersIter, newMembersIter);
fs.writeFileSync('server.js', content);
console.log('Fixed approve_group_points points allocation');
