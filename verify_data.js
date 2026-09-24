const http = require('http');

const PORT = 3000; // Using the already running dev server
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
  console.log('1. Checking current activities for test-pres-1...');
  
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
  console.log('2. Activity created in db.json!');

  const actsBefore = await makeRequest('/api/activities?presentationId=test-pres-1', 'GET');
  const foundBefore = actsBefore.activities.find(a => a.id === 'act_restart_test_999');
  if (foundBefore) {
      console.log('PASS: Data exists in DB before restart');
  } else {
      console.log('FAIL: Activity not found before restart');
  }
}

runTest();
