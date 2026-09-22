const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

// Replace 1: Zoom controls
code = code.replace(
  /\{currentActivity\?\.type === 'SHORT_ANSWER' && \(/g,
  "{['SHORT_ANSWER', 'CLASSIFICATION'].includes(currentActivity?.type) && ("
);

// Replace 2: The Padlet layout condition
code = code.replace(
  /\{currentActivity\?\.type === 'SHORT_ANSWER' \? \(/g,
  "{['SHORT_ANSWER', 'CLASSIFICATION'].includes(currentActivity?.type) ? ("
);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Updated conditions for Padlet layout');
