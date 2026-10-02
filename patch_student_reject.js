const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const rejectListener = `
    newSocket.on("submission_rejected", (data) => {
      if (data.studentId === systemId) {
        setSubmitted(false);
        setSelectedAnswers([]);
        setUploadProgress(0);
        alert("Giáo viên đã hủy file của bạn. Bạn có thể nộp lại file mới!");
      }
    });
`;

if (!content.includes('submission_rejected')) {
  content = content.replace(
    /newSocket\.on\("activity_started",/,
    rejectListener + '\n    newSocket.on("activity_started",'
  );
  fs.writeFileSync(file, content);
  console.log('Success - patched student page with submission_rejected');
}
