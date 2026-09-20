const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const oldTrophy = `  const [trophy, setTrophy] = useState<{show: boolean, points: number, label?: string}>({show: false, points: 0, label: ""});`;
const newTrophy = `  const [trophy, setTrophy] = useState<{show: boolean, points: number, label?: string, type?: string}>({show: false, points: 0, label: "", type: "FULL"});`;
content = content.replace(oldTrophy, newTrophy);

const oldName = `  const [studentName, setStudentName] = useState("");`;
const newName = `  const [studentName, setStudentName] = useState("");
  const [realStudentName, setRealStudentName] = useState<string>("");`;
content = content.replace(oldName, newName);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Fixed types precisely');
