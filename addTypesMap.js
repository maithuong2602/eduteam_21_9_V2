const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldApprove = `    const newApproved: Record<string, number> = {};
    
    Object.entries(responses).forEach(([socketId, ans]) => {
      let isCorrect = false;
      if (currentActivity.type === "MULTIPLE_CHOICE") {
        const correctIds = (currentActivity.options || []).filter((o:any) => o.isCorrect).map((o:any) => o.id);
        const studentAnsIds = Array.isArray(ans) ? ans : [ans];
        isCorrect = correctIds.length > 0 && correctIds.length === studentAnsIds.length && correctIds.every((id:any) => studentAnsIds.includes(id));
      } else if (currentActivity.type === "WORD_CLOUD" || currentActivity.type === "SHORT_ANSWER") {
        isCorrect = Array.isArray(ans) ? ans.length > 0 && ans[0] !== "" : ans !== "";
      }
      
      if (type === 'all') {
        newApproved[socketId] = points;
      } else if (type === 'correct_only') {
        newApproved[socketId] = isCorrect ? points : (points * 0.5);
      }
    });

    setApprovedPoints(newApproved);
    socket.emit('approve_points', {
      code: sessionCode,
      pointsMap: newApproved,
      activityDetails: {`;

const newApprove = `    const newApproved: Record<string, number> = {};
    const typesMap: Record<string, 'FULL' | 'PARTIAL'> = {};
    
    Object.entries(responses).forEach(([socketId, ans]) => {
      let isCorrect = false;
      if (currentActivity.type === "MULTIPLE_CHOICE") {
        const correctIds = (currentActivity.options || []).filter((o:any) => o.isCorrect).map((o:any) => o.id);
        const studentAnsIds = Array.isArray(ans) ? ans : [ans];
        isCorrect = correctIds.length > 0 && correctIds.length === studentAnsIds.length && correctIds.every((id:any) => studentAnsIds.includes(id));
      } else if (currentActivity.type === "WORD_CLOUD" || currentActivity.type === "SHORT_ANSWER") {
        isCorrect = Array.isArray(ans) ? ans.length > 0 && ans[0] !== "" : ans !== "";
      }
      
      if (type === 'all') {
        newApproved[socketId] = points;
        typesMap[socketId] = 'FULL';
      } else if (type === 'correct_only') {
        newApproved[socketId] = isCorrect ? points : (points * 0.5);
        typesMap[socketId] = isCorrect ? 'FULL' : 'PARTIAL';
      }
    });

    setApprovedPoints(newApproved);
    socket.emit('approve_points', {
      code: sessionCode,
      pointsMap: newApproved,
      typesMap,
      activityDetails: {`;

content = content.replace(oldApprove, newApprove);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Modified Teacher UI handleApprovePoints');
