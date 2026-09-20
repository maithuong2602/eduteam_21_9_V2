const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// 1. Add timeLeft state and useEffect
const oldState = `  const [trophy, setTrophy] = useState({ show: false, points: 0, label: "" });`;
const newState = `  const [trophy, setTrophy] = useState({ show: false, points: 0, label: "" });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (activity?.endTime && activity.type !== "NONE") {
       const updateTimer = () => {
         const remaining = Math.max(0, Math.floor((activity.endTime - Date.now()) / 1000));
         setTimeLeft(remaining);
         if (remaining === 0) setIsLocked(true);
       };
       updateTimer();
       const interval = setInterval(updateTimer, 1000);
       return () => clearInterval(interval);
    } else {
       setTimeLeft(null);
    }
  }, [activity]);
`;

content = content.replace(oldState, newState);

// 2. Add Timer UI right after the activity name
const oldTitle = `          <h2 className="text-2xl font-black text-blue-900">{activity.name}</h2>
        </div>`;
const newTitle = `          <h2 className="text-2xl font-black text-blue-900">{activity.name}</h2>
        </div>
        {timeLeft !== null && (
          <div className="bg-red-50 border-b-4 border-red-500 p-3 flex justify-center items-center shadow-inner">
            <Clock className={\`w-6 h-6 mr-2 \${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-600'}\`} />
            <span className={\`text-2xl font-black font-mono tracking-widest \${timeLeft <= 10 ? 'text-red-600' : 'text-gray-700'}\`}>
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}`;

content = content.replace(oldTitle, newTitle);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Added Countdown Timer to Student UI');
