const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const s1 = "{currentActivity?.type === 'SHORT_ANSWER' && (";
const r1 = "{['SHORT_ANSWER', 'CLASSIFICATION'].includes(currentActivity?.type || '') && (";
code = code.replace(s1, r1);

const s2 = "{currentActivity?.type === 'SHORT_ANSWER' ? (";
const r2 = "{['SHORT_ANSWER', 'CLASSIFICATION'].includes(currentActivity?.type || '') ? (";
code = code.replace(s2, r2);

// Make sure to format Classification newlines nicely in Padlet view
const s3 = "ansText = lines.join('\\n');";
const r3 = "ansText = lines.join('\\n');"; // It already uses \n, and Padlet view uses whitespace-pre-wrap

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Fixed Padlet conditions');
