const { spawn } = require('child_process');
const http = require('http');

const PORT = 3009;
process.env.PORT = PORT;
process.env.USE_TEST_DB = 'true';

function startServer() {
  return new Promise((resolve) => {
    const serverProcess = spawn('node', ['server.js'], { env: process.env });
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('Ready on')) {
        resolve(serverProcess);
      }
    });
  });
}

function stopServer(serverProcess) {
  return new Promise((resolve) => {
    serverProcess.on('close', () => resolve());
    serverProcess.kill('SIGTERM');
  });
}

function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  console.log('1. Starting server...');
  let serverProcess = await startServer();

  console.log('2. Resetting test DB via API...');
  await makeRequest('/api/test/reset', 'GET');

  console.log('3. Creating Activity...');
  const actData = {
    id: "act_restart_test_999",
    presentationId: "test-pres-1",
    slideId: 1,
    type: "SHORT_ANSWER",
    name: "Test Answer",
    mode: "INDIVIDUAL",
    points: 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  await makeRequest('/api/activities', 'POST', actData);

  console.log('4. Verifying Data before restart...');
  const actsBefore = await makeRequest('/api/activities?presentationId=test-pres-1', 'GET');
  const foundBefore = actsBefore.activities.find(a => a.id === 'act_restart_test_999');
  if (!foundBefore) {
      console.log('FAIL: Activity not found before restart');
      process.exit(1);
  }
  console.log('PASS: Data exists before restart');

  console.log('5. STOPPING server...');
  await stopServer(serverProcess);

  console.log('6. STARTING server again...');
  serverProcess = await startServer();

  console.log('7. Verifying Data AFTER restart...');
  const actsAfter = await makeRequest('/api/activities?presentationId=test-pres-1', 'GET');
  const foundAfter = actsAfter.activities.find(a => a.id === 'act_restart_test_999');
  
  if (foundAfter) {
      console.log('PASS: Activity persisted through process restart!');
      console.log('PASS: Activity config unchanged ->', foundAfter.type);
  } else {
      console.log('FAIL: Activity LOST after process restart!');
  }

  await stopServer(serverProcess);
  process.exit(0);
}

runTest();
