const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Add saveLedger to approve_points
const approvePointsRegex = /session\.studentPoints\[systemId\] = \(session\.studentPoints\[systemId\] \|\| 0\) \+ points;\s*activityPointsRecord\[systemId\] = points;/g;
const approvePointsReplacement = `session.studentPoints[systemId] = (session.studentPoints[systemId] || 0) + points;
        activityPointsRecord[systemId] = points;
        
        saveLedger({
          ledgerId: 'LED_' + Date.now() + '_' + student.id,
          studentId: student.id,
          sessionCode: data.code,
          classId: session.classId,
          activityId: 'ACTIVITY_SCORE',
          points: points,
          reason: 'ACTIVITY_SCORE',
          groupId: null,
          createdAt: Date.now()
        });`;

code = code.replace(approvePointsRegex, approvePointsReplacement);

// Add saveLedger to ACTIVITY_SCORE in approve_group_points
const groupPointsRegex = /session\.studentPoints\[primaryId\] = \(session\.studentPoints\[primaryId\] \|\| 0\) \+ scoreObj;/g;
const groupPointsReplacement = `session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) + scoreObj;
             
             saveLedger({
               ledgerId: 'LED_' + Date.now() + '_' + (validSt ? validSt.id : studentId),
               studentId: (validSt ? validSt.id : studentId),
               sessionCode: data.code,
               classId: session.classId,
               activityId: activityId,
               points: scoreObj,
               reason: 'ACTIVITY_SCORE',
               groupId: groupId,
               createdAt: Date.now()
             });`;

code = code.replace(groupPointsRegex, groupPointsReplacement);

fs.writeFileSync('server.js', code);
console.log('Added saveLedger to all point approvals');
