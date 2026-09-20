const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// Inject the style tag right before the return statement or at the top of the render
const styleBlock = `
      <style>
        {\`
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
          @keyframes glowPulse {
            0% { box-shadow: 0 0 20px rgba(250, 204, 21, 0.4); }
            50% { box-shadow: 0 0 60px rgba(250, 204, 21, 0.8); }
            100% { box-shadow: 0 0 20px rgba(250, 204, 21, 0.4); }
          }
          .epic-trophy {
            animation: epicTrophyFly 4.5s ease-out forwards;
          }
          .epic-score {
            animation: scorePop 4.5s ease-out forwards;
          }
          .trophy-container {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
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
        \`}
      </style>
`;

// Replace the old trophy UI
const oldTrophyRender = `{trophy.show && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center animate-fade-out" style={{ animationDuration: '3s' }}>
          <div className="flex flex-col items-center animate-bounce-up">
            <Trophy className="w-32 h-32 text-yellow-400 drop-shadow-lg" />
            <div className="text-4xl font-black text-yellow-500 mt-4 drop-shadow-md">
              +{trophy.points} {trophy.label || "điểm"}
            </div>
          </div>
        </div>
      )}`;

const newTrophyRender = `{trophy.show && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center trophy-container">
          <div className="flex flex-col items-center">
            <Trophy className="w-48 h-48 text-yellow-400 epic-trophy fill-yellow-400" />
            <div className="text-6xl font-black text-yellow-500 mt-6 epic-score drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
              +{trophy.points} {trophy.label || "điểm"}
            </div>
          </div>
        </div>
      )}`;

// We need to inject styleBlock right after return (
const returnIndex = content.indexOf('return (');
if (returnIndex !== -1) {
  const insertIndex = content.indexOf('<div', returnIndex);
  if (insertIndex !== -1) {
    content = content.slice(0, insertIndex + 4) + styleBlock + content.slice(insertIndex + 4);
  }
}

content = content.replace(oldTrophyRender, newTrophyRender);
fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Fixed Trophy Animation');
