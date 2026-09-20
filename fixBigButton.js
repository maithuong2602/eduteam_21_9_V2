const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldHandle = `  const handleApproveGroupPoints = () => {
    if (!socket || !sessionCode || !currentActivityId) return;
    const currentActivity = activities[currentActivityId] || {};
    
    const scores: Record<string, number> = {};
    groups.forEach((g: any) => {
      const ws = workspaces[g.id];
      if (ws && ws.status === 'SUBMITTED') {
         scores[g.id] = currentActivity?.points || 1; // Basic full points for now
      }
    });
    
    socket.emit('approve_group_points', {
      code: sessionCode,
      activityId: currentActivityId,
      scores,
      activityDetails: {
        slideNumber: selectedSlide,
        type: currentActivity?.type,
        name: currentActivity?.name || \`HD\${selectedSlide}\`,
        mode: currentActivity?.mode || 'GROUP',
        bonusType: currentActivity?.bonusType || 'NONE',
        bonusPoints: currentActivity?.bonusPoints || 0
      }
    });
    alert('Đã duyệt điểm nhóm thành công!');
  };`;

const newHandle = `  const handleApproveGroupPoints = () => {
    if (!socket || !sessionCode || !currentActivityId) return;
    const currentActivity = activities[currentActivityId] || {};
    
    const isConfirmed = window.confirm("Hành động này sẽ cộng điểm cho TẤT CẢ thành viên của các nhóm đã nộp bài.\n\nNếu bạn muốn loại trừ học sinh vắng mặt/không tham gia, vui lòng bấm nút 'Duyệt' nhỏ màu xanh ở cạnh tên từng nhóm thay vì nút này.\n\nBạn có chắc chắn muốn duyệt nhanh cho tất cả?");
    if (!isConfirmed) return;

    const scores: Record<string, number> = {};
    groups.forEach((g: any) => {
      const ws = workspaces[g.id];
      if (ws && ws.status === 'SUBMITTED') {
         scores[g.id] = currentActivity?.points || 1; // Basic full points for now
      }
    });
    
    if (Object.keys(scores).length === 0) {
       alert("Chưa có nhóm nào nộp bài để duyệt!");
       return;
    }

    socket.emit('approve_group_points', {
      code: sessionCode,
      activityId: currentActivityId,
      scores,
      activityDetails: {
        slideNumber: selectedSlide,
        type: currentActivity?.type,
        name: currentActivity?.name || \`HD\${selectedSlide}\`,
        mode: currentActivity?.mode || 'GROUP',
        bonusType: currentActivity?.bonusType || 'NONE',
        bonusPoints: currentActivity?.bonusPoints || 0
      }
    });
    alert('Đã duyệt điểm cho tất cả các nhóm nộp bài thành công!');
  };`;

content = content.replace(oldHandle, newHandle);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Added confirm dialog to big button');
