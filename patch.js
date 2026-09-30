const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const target = `        points = scoreEngine.cleanScore(points);
        pointsMap[socketId] = points;
        typesMap[socketId] = typeStr;

        session.studentPoints[systemId] = scoreEngine.cleanScore((session.studentPoints[systemId] || 0) + points);
        activityPointsRecord[systemId] = points;
        isCorrectRecord[systemId] = data.manualOverride ? true : result.isCorrect;
        calculatedAtRecord[systemId] = Date.now();
        if (bd) {
           breakdownRecord[systemId] = bd;
        }
        if (bs) {
           bonusRecord[systemId] = bs;
        }
        
        saveLedger({
          ledgerId: 'LED_' + Date.now() + '_' + actualStudentId,
          studentId: actualStudentId,
          sessionCode: data.code,
          classId: session.classId,
          activityId: 'ACTIVITY_SCORE',
          points: points,
          reason: 'ACTIVITY_SCORE',
          groupId: null,
          createdAt: Date.now()
        });`;

const replacement = `        points = scoreEngine.cleanScore(points);
        pointsMap[socketId] = points;
        typesMap[socketId] = typeStr;

        let targetMembers = [{ id: actualStudentId, systemId: systemId }];
        let groupId = null;
        
        if (data.activityDetails?.mode === 'GROUP' && session.groups) {
           const group = session.groups.find(g => g.members.some(m => String(m.studentId) === String(actualStudentId)));
           if (group) {
              groupId = group.id;
              if (session._awardedGroups && session._awardedGroups.has(groupId)) {
                  // Skip if this group already got points in this batch
                  targetMembers = [];
              } else {
                  if (!session._awardedGroups) session._awardedGroups = new Set();
                  session._awardedGroups.add(groupId);
                  targetMembers = group.members.map(m => {
                     const vSt = session.validStudents?.find(vs => String(vs.id) === String(m.studentId));
                     return { id: m.studentId, systemId: vSt ? vSt.id : m.studentId };
                  });
              }
           }
        }
        
        targetMembers.forEach(m => {
            if (!m.id) return;
            const memSystemId = m.systemId;
            const memActualId = m.id;
            
            session.studentPoints[memSystemId] = scoreEngine.cleanScore((session.studentPoints[memSystemId] || 0) + points);
            activityPointsRecord[memSystemId] = points;
            isCorrectRecord[memSystemId] = data.manualOverride ? true : result.isCorrect;
            calculatedAtRecord[memSystemId] = Date.now();
            if (bd) breakdownRecord[memSystemId] = bd;
            if (bs) bonusRecord[memSystemId] = bs;
            
            saveLedger({
              ledgerId: 'LED_' + Date.now() + '_' + memActualId + '_' + Math.random().toString(36).substring(7),
              studentId: memActualId,
              sessionCode: data.code,
              classId: session.classId,
              activityId: data.activityDetails?.id || 'ACTIVITY_SCORE',
              points: points,
              reason: groupId ? 'GROUP_ACTIVITY_SCORE' : 'ACTIVITY_SCORE',
              groupId: groupId,
              createdAt: Date.now()
            });
        });`;

const targetNormalized = target.replace(/\r\n/g, '\n');
const contentNormalized = content.replace(/\r\n/g, '\n');

if (contentNormalized.includes(targetNormalized)) {
    content = contentNormalized.replace(targetNormalized, replacement);
    // Clean up awarded groups
    content = content.replace('const rawResponses = data.activityDetails?.responses || {};', 'const rawResponses = data.activityDetails?.responses || {};\n    session._awardedGroups = new Set();');
    fs.writeFileSync('server.js', content);
    console.log('Replaced successfully');
} else {
    console.log('Target not found!');
}
