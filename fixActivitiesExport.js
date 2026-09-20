const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldHistory = `        const historyRows = data.ledgers.map((l: any) => ({
           "Thời gian": new Date(l.createdAt).toLocaleString('vi-VN'),
           "Activity_ID": l.activityId,
           "SourceType": l.reason === 'ACTIVITY_SCORE' ? 'ACTIVITY SCORE' : (l.reason === 'INDIVIDUAL_BONUS' ? 'INDIVIDUAL BONUS' : 'GROUP BONUS'),
           "Group_ID": l.groupId || 'N/A',
           "Points": '+' + l.points,
           "Reason": l.reason
        }));`;

const newHistory = `        const historyRows = data.ledgers.map((l: any) => ({
           "Thời gian": new Date(l.createdAt).toLocaleString('vi-VN'),
           "Activity_ID": l.activityId,
           "SourceType": l.reason === 'ACTIVITY_SCORE' ? 'ACTIVITY SCORE' : (l.reason === 'INDIVIDUAL_BONUS' ? 'INDIVIDUAL BONUS' : 'GROUP BONUS'),
           "Group_ID": l.groupId || 'N/A',
           "Points": '+' + l.points,
           "Reason": l.reason
        }));
        
        const activityRows = Object.values(activities).map((act: any) => ({
          "Activity_ID": act.id,
          "Tên hoạt động": act.name || \`Slide \${act.slideNumber}\`,
          "Loại hoạt động": act.type,
          "Thời gian": act.duration || 0,
          "Điểm": act.points || 1,
          "Chế độ làm bài": act.mode === 'GROUP' ? 'Theo nhóm' : 'Cá nhân',
          "Bonus Type": act.bonusType || 'NONE',
          "Bonus Points": act.bonusPoints || 0
        }));`;

content = content.replace(oldHistory, newHistory);

const oldAppend = `        const wsHistory = xlsx.utils.json_to_sheet(historyRows || []);
        xlsx.utils.book_append_sheet(wb, wsHistory, "Bonus_History");

        xlsx.writeFile(wb, \`TongHop_KetQua_\${sessionCode}.xlsx\`);`;

const newAppend = `        const wsHistory = xlsx.utils.json_to_sheet(historyRows || []);
        xlsx.utils.book_append_sheet(wb, wsHistory, "Bonus_History");
        
        const wsActivities = xlsx.utils.json_to_sheet(activityRows || []);
        xlsx.utils.book_append_sheet(wb, wsActivities, "Hoat_Dong");

        xlsx.writeFile(wb, \`TongHop_KetQua_\${sessionCode}.xlsx\`);`;

content = content.replace(oldAppend, newAppend);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Added activities sheet to Excel');
