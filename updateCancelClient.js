const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const oldState = `  const [realStudentName, setRealStudentName] = useState<string>("");`;
const newState = `  const [realStudentName, setRealStudentName] = useState<string>("");
  const [bonusRequests, setBonusRequests] = useState<string[]>([]);`;
content = content.replace(oldState, newState);

const oldListener = `    newSocket.on("joined", (data) => {`;
const newListener = `    newSocket.on("bonus_requests_updated", (requests) => {
      setBonusRequests(requests || []);
    });
    newSocket.on("joined", (data) => {`;
content = content.replace(oldListener, newListener);

const oldPointsAwarded = `      if (myPoints > 0) {
        setTrophy({ show: true, points: myPoints, label: "", type: myType });
        setTimeout(() => {
          setTrophy({ show: false, points: 0, label: "", type: 'FULL' });
        }, 5000);
      }
    });`;
const newPointsAwarded = `      if (myPoints > 0) {
        setTrophy({ show: true, points: myPoints, label: "", type: myType });
        setTimeout(() => {
          setTrophy({ show: false, points: 0, label: "", type: 'FULL' });
        }, 5000);
      } else if (myPoints < 0 && myType === 'PENALTY') {
        alert("Cảnh báo: Bạn đã bị TRỪ " + Math.abs(myPoints) + " điểm vì hủy giơ tay nhiều lần!");
      }
    });`;
content = content.replace(oldPointsAwarded, newPointsAwarded);

const oldBtn = `          <button 
            onClick={() => {
              if(socket) socket.emit('request_bonus', { code: sessionCode, studentId: studentName });
              alert('Đã giơ tay! Giáo viên sẽ nhận được thông báo của bạn.');
            }}
            className="flex items-center space-x-1 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-full border border-green-300 transition-colors shadow-sm active:scale-95"
            title="Xin điểm thưởng / Phát biểu"
          >
            <span className="text-lg leading-none">🙋</span>
            <span className="text-sm font-bold text-green-700 hidden sm:inline">Phát biểu</span>
          </button>`;

const newBtn = `          {bonusRequests.includes(studentName) ? (
            <button 
              onClick={() => {
                if(socket) socket.emit('cancel_bonus_request', { code: sessionCode, studentId: studentName });
              }}
              className="flex items-center space-x-1 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-full border border-red-300 transition-colors shadow-sm active:scale-95 animate-pulse"
              title="Hủy giơ tay"
            >
              <span className="text-lg leading-none">❌</span>
              <span className="text-sm font-bold text-red-700 hidden sm:inline">Hủy giơ tay</span>
            </button>
          ) : (
            <button 
              onClick={() => {
                if(socket) socket.emit('request_bonus', { code: sessionCode, studentId: studentName });
              }}
              className="flex items-center space-x-1 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-full border border-green-300 transition-colors shadow-sm active:scale-95"
              title="Xin điểm thưởng / Phát biểu"
            >
              <span className="text-lg leading-none">🙋</span>
              <span className="text-sm font-bold text-green-700 hidden sm:inline">Phát biểu</span>
            </button>
          )}`;

content = content.replace(oldBtn, newBtn);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Updated Student UI for cancel feature');
