const fs = require('fs');
const file = 'server.js';
let content = fs.readFileSync(file, 'utf8');

const rejectLogic = `
  socket.on("reject_submission", (data) => {
    const { code, studentId, activityId, fileUrl } = data;
    if (sessions[code] && sessions[code].responses) {
      delete sessions[code].responses[studentId];
      if (fileUrl) {
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(process.cwd(), 'public', fileUrl);
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e){}
      }
      io.to(code).emit("submission_rejected", { studentId, activityId });
      triggerAutoSave();
    }
  });
`;

if (!content.includes('reject_submission')) {
  content = content.replace(
    /socket\.on\("submit_answer"/,
    rejectLogic + '\n  socket.on("submit_answer"'
  );
  fs.writeFileSync(file, content);
  console.log('Success - patched server.js with reject_submission');
}
