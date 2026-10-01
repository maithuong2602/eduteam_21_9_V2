const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add timeLeft state
content = content.replace(
  'const [systemId, setSystemId] = useState<string>("");',
  'const [systemId, setSystemId] = useState<string>("");\n    const [timeLeft, setTimeLeft] = useState<number | null>(null);'
);

// Add useEffect for timer
const timerEffect = `
    useEffect(() => {
      if (activity && activity.endTime) {
        const updateTimer = () => {
          const remaining = Math.max(0, Math.floor((activity.endTime - Date.now()) / 1000));
          setTimeLeft(remaining);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
      } else {
        setTimeLeft(null);
      }
    }, [activity]);
`;
content = content.replace(
  'useEffect(() => {\n      if (!systemId || availableGroups.length === 0)',
  timerEffect + '\n    useEffect(() => {\n      if (!systemId || availableGroups.length === 0)'
);

// Add timer rendering
const timerUI = `
          {/* Timer Area */}
          {timeLeft !== null && (
            <div className={\`mb-6 p-4 rounded-2xl font-bold text-xl flex flex-col items-center justify-center transition-all shadow-md \${
              timeLeft <= 5 && timeLeft > 0 ? 'bg-red-500 text-white animate-pulse scale-105 border-4 border-red-300' : 
              timeLeft === 0 ? 'bg-red-600 text-white opacity-80' : 
              'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 border-2 border-blue-200'
            }\`}>
              <div className="flex items-center">
                <Clock className={\`w-7 h-7 mr-3 \${timeLeft <= 5 && timeLeft > 0 ? 'animate-bounce' : ''}\`} />
                <span>
                  {timeLeft > 0 ? (
                    timeLeft <= 5 ? \`CHÚ Ý: Chỉ còn \${timeLeft}s! Nộp bài ngay!\` : \`Thời gian còn lại: \${timeLeft}s\`
                  ) : "Đã hết thời gian!"}
                </span>
              </div>
              {timeLeft <= 5 && timeLeft > 0 && (
                <div className="text-sm mt-1 font-medium opacity-90 animate-ping absolute -top-2 -right-2 bg-yellow-400 text-black px-2 py-1 rounded-full">!</div>
              )}
            </div>
          )}

          {/* Interaction Area */}`;
content = content.replace('{/* Interaction Area */}', timerUI);

fs.writeFileSync(file, content);
console.log('Success');
