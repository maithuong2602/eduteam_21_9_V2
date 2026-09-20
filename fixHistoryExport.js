const fs = require('fs');
let fileContent = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldHistory = `        const historyRows = data.ledgers.map((l: any) => ({
           "Thời gian": new Date(l.createdAt).toLocaleString('vi-VN'),
           "Activity_ID": l.activityId,
           "SourceType": l.reason === 'ACTIVITY_SCORE' ? 'ACTIVITY SCORE' : (l.reason === 'INDIVIDUAL_BONUS' ? 'INDIVIDUAL BONUS' : 'GROUP BONUS'),
           "Group_ID": l.groupId || 'N/A',
           "Points": '+' + l.points,
           "Reason": l.reason
        }));`;

const newHistory = `        const historyRows = data.ledgers.map((l: any) => {
           const act = activities[l.activityId] || {};
           return {
             "Thời gian": new Date(l.createdAt).toLocaleString('vi-VN'),
             "Activity_ID": l.activityId,
             "Tên hoạt động": act.name || 'N/A',
             "Chế độ làm bài": act.mode === 'GROUP' ? 'Theo nhóm' : 'Cá nhân',
             "SourceType": l.reason === 'ACTIVITY_SCORE' ? 'ACTIVITY SCORE' : (l.reason === 'INDIVIDUAL_BONUS' ? 'INDIVIDUAL BONUS' : 'GROUP BONUS'),
             "Group_ID": l.groupId || 'N/A',
             "Points": '+' + l.points,
             "Reason": l.reason
           };
        });`;

fileContent = fileContent.replace(oldHistory, newHistory);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', fileContent);
console.log('Fixed historyRows details');
