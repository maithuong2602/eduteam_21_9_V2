const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const oldHeader = `      <div className="bg-white border-b border-gray-200 p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <div className="font-bold text-blue-600">EduTeam</div>
        <div className="flex items-center space-x-4">`;

const newHeader = `      <div className="bg-white border-b border-gray-200 p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <div className="font-bold text-blue-600">EduTeam</div>
        <div className="flex items-center space-x-4">
          <button 
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

content = content.replace(oldHeader, newHeader);
fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Added raise hand button to student UI');
