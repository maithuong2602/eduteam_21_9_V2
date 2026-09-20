const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const oldStateTrophy = `  const [trophy, setTrophy] = useState({ show: false, points: 0, label: "" });`;
const newStateTrophy = `  const [trophy, setTrophy] = useState<{ show: boolean, points: number, label?: string, type: string }>({ show: false, points: 0, label: "", type: "FULL" });`;
content = content.replace(oldStateTrophy, newStateTrophy);

if (!content.includes('const [realStudentName, setRealStudentName] = useState<string>("");')) {
  const injectionPoint = `  const [timeLeft, setTimeLeft] = useState<number | null>(null);`;
  content = content.replace(injectionPoint, `  const [timeLeft, setTimeLeft] = useState<number | null>(null);\n  const [realStudentName, setRealStudentName] = useState<string>("");`);
}

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Fixed typescript issues in Student UI');
