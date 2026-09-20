const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// 1. Update State
const oldState = `  const [trophy, setTrophy] = useState({ show: false, points: 0, label: "" });`;
const newState = `  const [trophy, setTrophy] = useState({ show: false, points: 0, label: "", type: "FULL" });`;
content = content.replace(oldState, newState);

// 2. Update points_awarded listener
const oldListener = `    newSocket.on("points_awarded", (pointsMap) => {
      const socketId = newSocket.id;
      // myId can be the entered student ID, which might be in pointsMap for group bonuses
      const myId = name;
      const myPoints = (socketId && pointsMap[socketId]) || (myId && pointsMap[myId]) || 0;
      if (myPoints > 0) {
        setTrophy({ show: true, points: myPoints });
        setTimeout(() => {
          setTrophy({ show: false, points: 0 });
        }, 5000);
      }
    });`;
const newListener = `    newSocket.on("points_awarded", (pointsMap, typesMap = {}) => {
      const socketId = newSocket.id;
      const myId = name;
      const myPoints = (socketId && pointsMap[socketId]) || (myId && pointsMap[myId]) || 0;
      const myType = (socketId && typesMap[socketId]) || (myId && typesMap[myId]) || 'FULL';
      
      if (myPoints > 0) {
        setTrophy({ show: true, points: myPoints, label: "", type: myType });
        setTimeout(() => {
          setTrophy({ show: false, points: 0, label: "", type: 'FULL' });
        }, 5000);
      }
    });`;
content = content.replace(oldListener, newListener);

// 3. Update the render logic for the Trophy
const oldRender = `      {trophy.show && (
        <div className="trophy-container">
          <div className="flex flex-col items-center">
            <Trophy className="w-48 h-48 text-yellow-400 epic-trophy fill-yellow-400" />
            <div className="text-6xl font-black text-yellow-500 mt-6 epic-score drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
              +{trophy.points} {trophy.label || "điểm"}
            </div>
          </div>
        </div>
      )}`;

const newRender = `      {trophy.show && (
        <div className="trophy-container">
          <div className="flex flex-col items-center">
            <Trophy className={\`w-48 h-48 \${trophy.type === 'PARTIAL' ? 'text-slate-400 fill-slate-300 epic-trophy-silver' : 'text-yellow-400 fill-yellow-400 epic-trophy'}\`} />
            <div className={\`text-6xl font-black mt-6 epic-score drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] \${trophy.type === 'PARTIAL' ? 'text-slate-500' : 'text-yellow-500'}\`}>
              +{trophy.points} {trophy.label || "điểm"}
            </div>
          </div>
        </div>
      )}`;
content = content.replace(oldRender, newRender);

// 4. Update the CSS for Silver Trophy
const oldCss = `          @keyframes epicTrophyFly {`;
const newCss = `          @keyframes epicTrophyFlySilver {
            0% { transform: translateY(100px) scale(0.5); opacity: 0; }
            15% { transform: translateY(0px) scale(1.2); opacity: 1; filter: drop-shadow(0 0 20px rgba(148, 163, 184, 0.8)); }
            25% { transform: translateY(0px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(148, 163, 184, 1)); }
            70% { transform: translateY(-10px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(148, 163, 184, 1)); }
            100% { transform: translateY(-200px) scale(0.5); opacity: 0; filter: drop-shadow(0 0 0px rgba(148, 163, 184, 0)); }
          }
          .epic-trophy-silver {
            animation: epicTrophyFlySilver 4.5s ease-out forwards;
          }
          @keyframes epicTrophyFly {`;
content = content.replace(oldCss, newCss);

// 5. Update Student Name Display ("Giao diện học sinh nên hiển thị tên bên cạnh mã thay vì hiển thị mã không")
const oldName = `            <span className="text-sm font-bold text-yellow-700">Hạng {myRankIndex + 1} ({myPoints}đ)</span>
                  </div>
                );
              }
              return (
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  <span className="text-sm font-bold text-blue-700">0đ</span>
                </div>
              );
           })()}
          <div className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
            {studentName}
          </div>
        </div>
      </div>`;

const newName = `            <span className="text-sm font-bold text-yellow-700">Hạng {myRankIndex + 1} ({myPoints}đ)</span>
                  </div>
                );
              }
              return (
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  <span className="text-sm font-bold text-blue-700">0đ</span>
                </div>
              );
           })()}
          <div className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
            {(() => {
               const st = leaderboard.find(l => l.systemId === studentName || l.systemId === studentName);
               return st && st.name && st.name !== studentName ? \`\${studentName} - \${st.name}\` : studentName;
            })()}
          </div>
        </div>
      </div>`;
content = content.replace(oldName, newName);

// Let's also check if studentName is shown in the waiting screen!
const oldWaiting = `<h2 className="text-2xl font-bold text-gray-800 mb-2">Xin chào, {studentName}!</h2>`;
const newWaiting = `<h2 className="text-2xl font-bold text-gray-800 mb-2">Xin chào, {(() => {
  const st = leaderboard.find(l => l.systemId === studentName || l.systemId === studentName);
  return st && st.name && st.name !== studentName ? \`\${studentName} - \${st.name}\` : studentName;
})()}!</h2>`;
content = content.replace(oldWaiting, newWaiting);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Fixed trophy colors and student name');
