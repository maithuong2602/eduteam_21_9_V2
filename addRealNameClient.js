const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const oldState = `  const [timeLeft, setTimeLeft] = useState<number | null>(null);`;
const newState = `  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [realStudentName, setRealStudentName] = useState<string>("");`;
content = content.replace(oldState, newState);

const oldJoinSuccess = `    newSocket.on("join_success", () => {
      setStatus("waiting");
    });`;
const newJoinSuccess = `    newSocket.on("join_success", (data) => {
      setStatus("waiting");
      if (data && data.realName) setRealStudentName(data.realName);
    });`;
content = content.replace(oldJoinSuccess, newJoinSuccess);

const oldNameRender1 = `<div className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
            {(() => {
               const st = leaderboard.find(l => l.systemId === studentName || l.systemId === studentName);
               return st && st.name && st.name !== studentName ? \`\${studentName} - \${st.name}\` : studentName;
            })()}
          </div>`;
const newNameRender1 = `<div className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
            {realStudentName && realStudentName !== studentName ? \`\${studentName} - \${realStudentName}\` : studentName}
          </div>`;
content = content.replace(oldNameRender1, newNameRender1);

const oldNameRender2 = `<h2 className="text-2xl font-bold text-gray-800 mb-2">Xin chào, {(() => {
  const st = leaderboard.find(l => l.systemId === studentName || l.systemId === studentName);
  return st && st.name && st.name !== studentName ? \`\${studentName} - \${st.name}\` : studentName;
})()}!</h2>`;
const newNameRender2 = `<h2 className="text-2xl font-bold text-gray-800 mb-2">Xin chào, {realStudentName || studentName}!</h2>`;
content = content.replace(oldNameRender2, newNameRender2);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Added realStudentName to Student UI');
