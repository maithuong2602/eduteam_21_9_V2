const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const oldMembersIter = `           group.members.forEach(m => {
             const studentId = m.studentId;
             studentBonusLedgers.push({`;
const newMembersIter = `           const validMembers = data.approvedMembers && data.approvedMembers[groupId] ? group.members.filter(m => data.approvedMembers[groupId].includes(m.studentId)) : group.members;
           validMembers.forEach(m => {
             const studentId = m.studentId;
             studentBonusLedgers.push({`;

content = content.replace(oldMembersIter, newMembersIter);
fs.writeFileSync('server.js', content);
console.log('Fixed server.js group bonus members');
