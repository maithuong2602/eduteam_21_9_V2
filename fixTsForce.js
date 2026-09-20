const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

content = content.replace(
  `const [trophy, setTrophy] = useState({ show: false, points: 0, label: "", type: "FULL" });`,
  `const [trophy, setTrophy] = useState<{ show: boolean, points: number, label?: string, type: string }>({ show: false, points: 0, label: "", type: "FULL" });`
);

// If realStudentName is still missing, let's inject it forcefully after studentName
content = content.replace(
  `const [studentName, setStudentName] = useState<string>("");`,
  `const [studentName, setStudentName] = useState<string>("");\n  const [realStudentName, setRealStudentName] = useState<string>("");`
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Fixed typescript issues forcefully');
