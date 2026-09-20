const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

// Find the states
const classListState = `  const [classList, setClassList] = useState<any[]>([]);\n`;
const selectedClassState = `  const [selectedClass, setSelectedClass] = useState<string>("");\n`;
const classStudentsState = `  const [classStudents, setClassStudents] = useState<any[]>([]);\n`;

// Remove them from current position
content = content.replace(classListState, '');
content = content.replace(selectedClassState, '');
content = content.replace(classStudentsState, '');

// Insert them right after const id = params.id as string;
const insertPoint = `  const id = params.id as string;\n`;
const replacement = insertPoint + classListState + selectedClassState + classStudentsState;

content = content.replace(insertPoint, replacement);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Fixed ReferenceError by hoisting states');
