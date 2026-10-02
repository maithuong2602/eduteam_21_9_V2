const fs = require('fs');
const file = 'src/lib/scoreEngine.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "else if (input.activityType === 'SHORT_ANSWER' || input.activityType === 'WORD_CLOUD') {",
  "else if (input.activityType === 'SHORT_ANSWER' || input.activityType === 'WORD_CLOUD' || input.activityType === 'FILE_UPLOAD') {"
);

fs.writeFileSync(file, content);
console.log('Success');
