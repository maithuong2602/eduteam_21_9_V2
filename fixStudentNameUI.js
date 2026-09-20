const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const oldNameRender1 = `{realStudentName && realStudentName !== studentName ? \`\${studentName} - \${realStudentName}\` : studentName}`;
const newNameRender1 = `{realStudentName || studentName}`;
content = content.replace(oldNameRender1, newNameRender1);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Fixed Student UI Name display');
