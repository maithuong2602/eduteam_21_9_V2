const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldListener = `    newSocket.on('student_requested_bonus', (studentId: string) => {
      setBonusRequests((prev: string[]) => {
        if (!prev.includes(studentId)) return [...prev, studentId];
        return prev;
      });
    });`;

const newListener = `    newSocket.on('bonus_requests_updated', (requests: string[]) => {
      setBonusRequests(requests || []);
    });`;

content = content.replace(oldListener, newListener);

const oldBulkBtn = `                    <button 
                      onClick={() => {
                        if(socket && sessionCode) {
                          bonusRequests.forEach(studentId => {
                             socket.emit('approve_individual_bonus', { code: sessionCode, studentId, points: 1 });
                          });
                          setBonusRequests([]);
                        }
                      }}`;

const newBulkBtn = `                    <button 
                      onClick={() => {
                        if(socket && sessionCode) {
                          socket.emit('approve_all_bonus', { code: sessionCode });
                        }
                      }}`;

content = content.replace(oldBulkBtn, newBulkBtn);

// Also remove setBonusRequests(prev => filter) in single approve
const oldSingleBtn = `                              socket.emit('approve_individual_bonus', { code: sessionCode, studentId, points: 1 });
                              setBonusRequests(prev => prev.filter(id => id !== studentId));`;
const newSingleBtn = `                              socket.emit('approve_individual_bonus', { code: sessionCode, studentId, points: 1 });`;
content = content.replace(oldSingleBtn, newSingleBtn);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Updated Teacher UI bonus listeners');
