const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const oldAlert = `      } else if (myPoints < 0 && myType === 'PENALTY') {
        alert("Cảnh báo: Bạn đã bị TRỪ " + Math.abs(myPoints) + " điểm vì hủy giơ tay nhiều lần!");
      }`;

const newAlert = `      } else if (myPoints < 0 && myType === 'PENALTY') {
        alert("Cảnh báo: Bạn đã bị TRỪ " + Math.abs(myPoints) + " điểm vì tự hủy giơ tay nhiều lần!");
      } else if (myPoints < 0 && myType === 'TEACHER_REJECT_PENALTY') {
        alert("Cảnh báo: Giáo viên đã từ chối phát biểu của bạn nhiều lần. Bạn bị trừ " + Math.abs(myPoints) + " điểm!");
      }`;

content = content.replace(oldAlert, newAlert);
fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Added TEACHER_REJECT_PENALTY alert to Student UI');
