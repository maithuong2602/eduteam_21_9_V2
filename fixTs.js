const fs = require('fs');

// 1. Fix student page null argument
let codeStudent = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');
codeStudent = codeStudent.replace(
  'const handleWorkspaceChange = (item: string, value: string) => {',
  'const handleWorkspaceChange = (item: string, value: string | null) => {'
);
fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', codeStudent);

// 2. Fix teacher page typesMap declaration
let codeTeacher = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');
codeTeacher = codeTeacher.replace(
  "const typesMap: Record<string, 'FULL' | 'PARTIAL'> = {};",
  "const typesMap: Record<string, 'FULL' | 'PARTIAL' | 'INCORRECT'> = {};"
);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', codeTeacher);

console.log('Fixed TypeScript errors');
