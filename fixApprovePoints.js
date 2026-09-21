const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const regex = /for\s*\(\s*const\s*\[\s*socketId\s*,\s*points\s*\]\s*of\s*Object\.entries\(data\.pointsMap\)\s*\)\s*\{[\s\S]*?saveLedger\(\{[\s\S]*?\}\);[\s\S]*?\}\s*\}/;

const replacement = `for (const [socketId, points] of Object.entries(data.pointsMap)) {
      const student = session.students.find(s => s.id === socketId);
      if (student) {
        const systemId = student.systemId;
        const validSt = session.validStudents?.find(vs => String(vs.systemId) === String(systemId));
        const actualStudentId = validSt ? validSt.id : systemId;
        
        session.studentPoints[systemId] = (session.studentPoints[systemId] || 0) + points;
        activityPointsRecord[systemId] = points;
        
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
        });
      }
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.js', code);
console.log('Fixed approve_points to use actualStudentId');
