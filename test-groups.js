const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log("TEST G1: Student chưa có group...");
  const dbPath = path.join(__dirname, 'src/data/db.json');
  let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  db.groups = []; // Clear groups
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  
  const res = await fetch('http://localhost:3000/api/groups');
  const data = await res.json();
  const group = data.groups.find(g => g.members.some(m => m.studentId === 'HS_TEST_1'));
  if (group) throw new Error("Expected Ungrouped");
  console.log("PASS G1");

  console.log("TEST G2: Add 1 student vào Group 1...");
  await fetch('http://localhost:3000/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ASSIGN', studentId: 'HS_TEST_1', groupId: 'GRP_1', classId: 'CLASS_1' })
  });
  
  const res2 = await fetch('http://localhost:3000/api/groups');
  const data2 = await res2.json();
  const group2 = data2.groups.find(g => g.members.some(m => m.studentId === 'HS_TEST_1'));
  if (!group2 || group2.id !== 'GRP_1') throw new Error("Expected Group 1");
  console.log("PASS G2");
  
  console.log("TEST G4: Student Group 1 -> Group 2...");
  await fetch('http://localhost:3000/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ASSIGN', studentId: 'HS_TEST_1', groupId: 'GRP_2', classId: 'CLASS_1' })
  });
  
  const res4 = await fetch('http://localhost:3000/api/groups');
  const data4 = await res4.json();
  const groupsWithStudent = data4.groups.filter(g => g.members.some(m => m.studentId === 'HS_TEST_1'));
  if (groupsWithStudent.length !== 1 || groupsWithStudent[0].id !== 'GRP_2') throw new Error("Expected only Group 2");
  console.log("PASS G4");
  
  console.log("TEST G5: Remove student bằng x...");
  await fetch('http://localhost:3000/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'REMOVE', studentId: 'HS_TEST_1' })
  });
  
  const res5 = await fetch('http://localhost:3000/api/groups');
  const data5 = await res5.json();
  const group5 = data5.groups.find(g => g.members.some(m => m.studentId === 'HS_TEST_1'));
  if (group5) throw new Error("Expected Ungrouped after remove");
  console.log("PASS G5");
  
  console.log("ALL BACKEND TESTS PASSED");
}

runTests().catch(console.error);
