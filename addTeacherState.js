const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldState = `  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);`;
const newState = `  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [bonusRequests, setBonusRequests] = useState<string[]>([]);
  const [showBonusModal, setShowBonusModal] = useState(false);`;

content = content.replace(oldState, newState);

const oldEffect = `    socket.on('export_ledgers_ready', (data) => {`;
const newEffect = `    socket.on('student_requested_bonus', (studentId: string) => {
      setBonusRequests((prev: string[]) => {
        if (!prev.includes(studentId)) return [...prev, studentId];
        return prev;
      });
    });
    
    socket.on('export_ledgers_ready', (data) => {`;

content = content.replace(oldEffect, newEffect);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Added states and socket listener to Teacher UI');
