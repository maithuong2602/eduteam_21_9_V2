const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

code = code.replace(
  /return \(\s*const padletColors = \[/,
  'const padletColors = ['
);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Fixed orphan return syntax error');
