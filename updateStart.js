const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const regex = /const startActivityForCurrentSlide = \(\) => \{\s*if \(socket && sessionCode && currentActivityId && activities\[currentActivityId\]\) \{[\s\S]*?const currentActivity = activities\[currentActivityId\];/;

const newStartLogic = `const startActivityForCurrentSlide = () => {
      if (socket && sessionCode && currentActivityId && activities[currentActivityId]) {
        const currentActivity = activities[currentActivityId];
        
        // Validation for CLASSIFICATION
        if (currentActivity.type === 'CLASSIFICATION') {
          if (!currentActivity.groups || currentActivity.groups.length < 2) return alert('Hoạt động Phân loại phải có ít nhất 2 nhóm.');
          if (!currentActivity.items || currentActivity.items.length === 0) return alert('Hoạt động Phân loại phải có ít nhất 1 mục.');
          for (const g of currentActivity.groups) {
             if (!g.name || g.name.trim() === '') return alert('Tên nhóm không được để trống.');
          }
          for (const i of currentActivity.items) {
             if (!i.text || i.text.trim() === '') return alert('Nội dung mục không được để trống.');
             if (!i.correctGroupId) return alert(\`Đối tượng '\${i.text}' chưa được xác định nhóm đúng.\`);
             if (!currentActivity.groups.some((g: any) => g.id === i.correctGroupId)) return alert(\`Đối tượng '\${i.text}' đang thuộc một nhóm không tồn tại.\`);
          }
        }
`;

code = code.replace(regex, newStartLogic);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Successfully added validation for Start Activity');
