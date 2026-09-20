const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const oldReturn = `  return (
    <div className="flex flex-col min-h-screen bg-gray-50 relative overflow-hidden">
      <style>{\`
        @keyframes flyTrophy {
          0% { transform: translate(-50%, 100vh) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, 30vh) scale(1.5); opacity: 1; }
          70% { transform: translate(-50%, 20vh) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -20vh) scale(0.5); opacity: 0; }
        }
        .animate-fly-trophy {
          animation: flyTrophy 4s ease-in-out forwards;
        }
      \`}</style>
      
      {trophy.show && (
        <div className="fixed left-1/2 bottom-0 z-50 pointer-events-none animate-fly-trophy flex flex-col items-center">
          <Trophy className="text-yellow-400 w-32 h-32 drop-shadow-2xl" fill="currentColor" />
          <div className="mt-4 bg-yellow-400 text-yellow-900 font-bold text-2xl px-6 py-2 rounded-full shadow-lg border-4 border-yellow-300">
            +{trophy.points} Điểm
          </div>
        </div>
      )}`;

const newReturn = `  return (
    <div className="flex flex-col min-h-screen bg-gray-50 relative overflow-hidden">
      <style>{\`
          @keyframes epicTrophyFly {
            0% { transform: translateY(100px) scale(0.5); opacity: 0; }
            15% { transform: translateY(0px) scale(1.2); opacity: 1; filter: drop-shadow(0 0 20px rgba(250, 204, 21, 0.8)); }
            25% { transform: translateY(0px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(250, 204, 21, 1)); }
            70% { transform: translateY(-10px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(250, 204, 21, 1)); }
            100% { transform: translateY(-200px) scale(0.5); opacity: 0; filter: drop-shadow(0 0 0px rgba(250, 204, 21, 0)); }
          }
          @keyframes scorePop {
            0% { transform: scale(0.5); opacity: 0; }
            20% { transform: scale(1.5); opacity: 1; }
            30% { transform: scale(1); opacity: 1; }
            70% { transform: scale(1); opacity: 1; }
            100% { transform: translateY(-50px); opacity: 0; }
          }
          .epic-trophy {
            animation: epicTrophyFly 4.5s ease-out forwards;
          }
          .epic-score {
            animation: scorePop 4.5s ease-out forwards;
          }
          .trophy-container {
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            pointer-events: none;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
            animation: fadeInOut 4.5s ease-in-out forwards;
          }
          @keyframes fadeInOut {
            0% { opacity: 0; backdrop-filter: blur(0px); }
            10% { opacity: 1; backdrop-filter: blur(4px); }
            70% { opacity: 1; backdrop-filter: blur(4px); }
            100% { opacity: 0; backdrop-filter: blur(0px); }
          }
      \`}</style>
      
      {trophy.show && (
        <div className="trophy-container">
          <div className="flex flex-col items-center">
            <Trophy className="w-48 h-48 text-yellow-400 epic-trophy fill-yellow-400" />
            <div className="text-6xl font-black text-yellow-500 mt-6 epic-score drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
              +{trophy.points} {trophy.label || "điểm"}
            </div>
          </div>
        </div>
      )}`;

content = content.replace(oldReturn, newReturn);
fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Fixed Trophy Animation Block');
