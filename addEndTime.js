const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldStart = `        bonusPoints: currentActivity.bonusPoints || 0,
        items: currentActivity.items,`;
const newStart = `        bonusPoints: currentActivity.bonusPoints || 0,
        endTime: Date.now() + timerDuration * 1000,
        items: currentActivity.items,`;

content = content.replace(oldStart, newStart);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Added endTime to startActivity');
