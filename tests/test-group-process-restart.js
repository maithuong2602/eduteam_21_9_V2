const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Setup environment
process.env.USE_TEST_DB = 'true';
process.env.PORT = '4567';

const DB_PATH = path.join(process.cwd(), 'src/data/db.test.json');

// Reset DB
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}
fs.writeFileSync(DB_PATH, JSON.stringify({
  groups: [
    {
      id: "GRP_TEST_1",
      name: "Group 1",
      className: "Class A",
      members: [
        { studentId: "HS001", name: "Student 1" },
        { studentId: "HS002", name: "Student 2" }
      ]
    },
    {
      id: "GRP_TEST_2",
      name: "Group 2",
      className: "Class A",
      members: [
        { studentId: "HS003", name: "Student 3" }
      ]
    }
  ]
}, null, 2));

console.log("DB Initialized.");

function waitForServer() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      http.get('http://localhost:4567/api/groups', (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
      }).on('error', () => {});
    }, 500);
  });
}

function fetchGroups() {
  return new Promise((resolve, reject) => {
    let data = '';
    http.get('http://localhost:4567/api/groups', (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function syncGroups(groups) {
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:4567/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      res.on('end', resolve);
      res.resume();
    });
    req.on('error', reject);
    req.write(JSON.stringify({ action: 'SYNC_ALL', groups }));
    req.end();
  });
}

async function runTest() {
  console.log("Starting server...");
  const server = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], { stdio: 'ignore', shell: true });
  
  await waitForServer();
  console.log("Server is up.");
  
  const initialData = await fetchGroups();
  let groups = initialData.groups;
  
  // Make changes: Move HS001 to Group 2, Remove HS002 from Group 1
  let g1 = groups.find(g => g.id === "GRP_TEST_1");
  let g2 = groups.find(g => g.id === "GRP_TEST_2");
  
  if (!g1 || !g2) {
      console.log("Groups found:", groups.map(g => g.id));
  }
  
  g1.members = []; // Removed both
  g2.members.push({ studentId: "HS001", name: "Student 1" }); // Added HS001
  
  console.log("Syncing changes to DB...");
  await syncGroups(groups);
  
  console.log("Killing server...");
  server.kill('SIGTERM');
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Restarting server...");
  const server2 = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], { stdio: 'ignore', shell: true });
  await waitForServer();
  console.log("Server is up again.");
  
  const finalData = await fetchGroups();
  const finalGroups = finalData.groups;
  
  const finalG1 = finalGroups.find(g => g.id === "GRP_TEST_1");
  const finalG2 = finalGroups.find(g => g.id === "GRP_TEST_2");
  
  server2.kill('SIGTERM');
  
  console.log("Verifying...");
  let passed = true;
  if (finalG1.members.find(m => m.studentId === "HS001")) { console.error("FAIL: HS001 still in G1"); passed = false; }
  if (finalG1.members.find(m => m.studentId === "HS002")) { console.error("FAIL: HS002 still in G1"); passed = false; }
  if (!finalG2.members.find(m => m.studentId === "HS001")) { console.error("FAIL: HS001 not in G2"); passed = false; }
  if (!finalG2.members.find(m => m.studentId === "HS003")) { console.error("FAIL: HS003 not in G2"); passed = false; }
  
  // Duplicate check
  const hs001Count = finalG2.members.filter(m => m.studentId === "HS001").length;
  if (hs001Count > 1) { console.error("FAIL: Duplicate HS001 in G2"); passed = false; }
  
  if (passed) {
    console.log("ALL TESTS PASSED!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTest().catch(console.error);
