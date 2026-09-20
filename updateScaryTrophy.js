const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// 1. Change the listener back to using setTrophy for negative points
const oldPointsAwarded = `      if (myPoints > 0) {
        setTrophy({ show: true, points: myPoints, label: "", type: myType });
        setTimeout(() => {
          setTrophy({ show: false, points: 0, label: "", type: 'FULL' });
        }, 5000);
      } else if (myPoints < 0 && myType === 'PENALTY') {
        alert("Cảnh báo: Bạn đã bị TRỪ " + Math.abs(myPoints) + " điểm vì tự hủy giơ tay nhiều lần!");
      } else if (myPoints < 0 && myType === 'TEACHER_REJECT_PENALTY') {
        alert("Cảnh báo: Giáo viên đã từ chối phát biểu của bạn nhiều lần. Bạn bị trừ " + Math.abs(myPoints) + " điểm!");
      }
    });`;

const newPointsAwarded = `      if (myPoints !== 0) {
        let label = "";
        if (myType === 'PENALTY') label = "điểm (Tự hủy giơ tay)";
        else if (myType === 'TEACHER_REJECT_PENALTY') label = "điểm (Bị từ chối)";
        else label = "điểm";
        
        setTrophy({ show: true, points: myPoints, label, type: myType });
        setTimeout(() => {
          setTrophy({ show: false, points: 0, label: "", type: 'FULL' });
        }, 5000);
      }
    });`;
content = content.replace(oldPointsAwarded, newPointsAwarded);

// 2. Change the render block to support the scary red style
const oldTrophyRender = `      {trophy.show && (
        <div className="trophy-container">
          <div className="flex flex-col items-center">
            <Trophy className={\`w-48 h-48 \${trophy.type === 'PARTIAL' ? 'text-slate-400 fill-slate-300 epic-trophy-silver' : 'text-yellow-400 fill-yellow-400 epic-trophy'}\`} />
            <div className={\`text-6xl font-black mt-6 epic-score drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] \${trophy.type === 'PARTIAL' ? 'text-slate-500' : 'text-yellow-500'}\`}>
              +{trophy.points} {trophy.label || "điểm"}
            </div>
          </div>
        </div>
      )}`;

const newTrophyRender = `      {trophy.show && (
        <div className="trophy-container">
          <div className="flex flex-col items-center">
            {trophy.type === 'PENALTY' || trophy.type === 'TEACHER_REJECT_PENALTY' ? (
              <>
                <div className="relative epic-trophy-red">
                  <Trophy className="w-48 h-48 text-red-500 fill-red-400" />
                  <div className="absolute inset-0 flex items-center justify-center text-7xl font-black text-white drop-shadow-md">X</div>
                </div>
                <div className="text-6xl font-black mt-6 epic-score drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] text-red-600">
                  {trophy.points} {trophy.label}
                </div>
              </>
            ) : (
              <>
                <Trophy className={\`w-48 h-48 \${trophy.type === 'PARTIAL' ? 'text-slate-400 fill-slate-300 epic-trophy-silver' : 'text-yellow-400 fill-yellow-400 epic-trophy'}\`} />
                <div className={\`text-6xl font-black mt-6 epic-score drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] \${trophy.type === 'PARTIAL' ? 'text-slate-500' : 'text-yellow-500'}\`}>
                  +{trophy.points} {trophy.label || "điểm"}
                </div>
              </>
            )}
          </div>
        </div>
      )}`;
content = content.replace(oldTrophyRender, newTrophyRender);

// 3. Add epic-trophy-red CSS animation with scary shake
const oldCss = `          @keyframes epicTrophyFlySilver {`;
const newCss = `          @keyframes epicTrophyRed {
            0% { transform: translateY(100px) scale(0.5); opacity: 0; filter: drop-shadow(0 0 0px rgba(239, 68, 68, 0)); }
            15% { transform: translateY(0px) scale(1.2); opacity: 1; filter: drop-shadow(0 0 40px rgba(239, 68, 68, 0.8)); }
            20% { transform: translateY(0px) scale(1) rotate(-10deg); filter: drop-shadow(0 0 50px rgba(239, 68, 68, 1)); }
            25% { transform: translateY(0px) scale(1) rotate(10deg); }
            30% { transform: translateY(0px) scale(1) rotate(-10deg); }
            35% { transform: translateY(0px) scale(1) rotate(0deg); }
            70% { transform: translateY(-10px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(239, 68, 68, 1)); }
            100% { transform: translateY(-200px) scale(0.5); opacity: 0; filter: drop-shadow(0 0 0px rgba(239, 68, 68, 0)); }
          }
          .epic-trophy-red {
            animation: epicTrophyRed 4.5s ease-out forwards;
          }
          @keyframes epicTrophyFlySilver {`;
content = content.replace(oldCss, newCss);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Updated Student UI with scary red trophy');
