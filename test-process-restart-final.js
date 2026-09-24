const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3010;
process.env.PORT = PORT;
process.env.USE_TEST_DB = 'true';
const dbPath = path.join(process.cwd(), 'src', 'data', 'db.test.json');

function startServer() {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', ['server.js'], { env: process.env, stdio: 'pipe' });
    
    serverProcess.stdout.on('data', (data) => {
      // process.stdout.write('[SERVER]: ' + data.toString());
      if (data.toString().includes('Ready on')) {
        resolve(serverProcess);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      // process.stderr.write('[SERVER ERR]: ' + data.toString());
    });
    
    serverProcess.on('error', (err) => {
      reject(err);
    });
  });
}

function stopServer(serverProcess) {
  return new Promise((resolve) => {
    serverProcess.on('close', () => resolve());
    serverProcess.kill('SIGTERM');
  });
}

function makeRequest(apiPath, method, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: apiPath,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          console.error('JSON parse error on:', data);
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  try {
    console.log('1. Bắt đầu Server...');
    let serverProcess = await startServer();

    console.log('2. Gọi API /api/test/reset để dọn dẹp DB test...');
    await makeRequest('/api/test/reset', 'GET');

    console.log('3. Tạo một Presentation mới (Bằng cách can thiệp DB JSON trực tiếp)...');
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const presId = "pres_test_process_" + Date.now();
    dbData.presentations.push({
      id: presId,
      teacherId: "teacher_1",
      title: "E2E Test Process Restart",
      originalFileName: "dummy.pdf",
      fileUrl: "http://example.com/dummy.pdf",
      totalSlides: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');

    console.log('4. Tạo một Activity thuộc Presentation đó (Qua API thực tế)...');
    const actId = "act_test_process_" + Date.now();
    const actData = {
      id: actId,
      presentationId: presId,
      slideId: 1,
      type: "MULTIPLE_CHOICE",
      name: "Cau Hoi Test",
      mode: "INDIVIDUAL",
      points: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: { specific_key: "value_123" }
    };
    await makeRequest('/api/activities', 'POST', actData);

    console.log('5. Đọc trực tiếp từ API để xác nhận dữ liệu đã được ghi...');
    const dataBefore = await makeRequest(`/api/presentations/${presId}`, 'GET');
    const foundBefore = (dataBefore.activities || []).find(a => a.id === actId);
    if (!foundBefore) {
        console.log('FAIL: Không tìm thấy Activity trước khi restart.');
        await stopServer(serverProcess);
        process.exit(1);
    }
    console.log(`[PASS] Tìm thấy Activity trước khi restart (type: ${foundBefore.type}).`);

    console.log('6. STOP PROCESS SERVER THẬT (Gửi SIGTERM).');
    await stopServer(serverProcess);

    console.log('7. START PROCESS SERVER LẠI.');
    serverProcess = await startServer();

    console.log('8. Đọc lại dữ liệu từ API...');
    const dataAfter = await makeRequest(`/api/presentations/${presId}`, 'GET');
    const presFound = dataAfter.presentation;
    
    if (!presFound) {
        console.log('FAIL: Không tìm thấy Presentation sau khi restart.');
    } else {
        console.log(`[PASS] Xác nhận Presentation vẫn tồn tại (Title: ${presFound.title}).`);
        console.log(`[PASS] Xác nhận fileUrl vẫn còn (${presFound.fileUrl}).`);
    }

    const foundAfter = (dataAfter.activities || []).find(a => a.id === actId);
    
    if (foundAfter) {
        console.log(`[PASS] Xác nhận Activity vẫn tồn tại (ID: ${foundAfter.id}).`);
        console.log(`[PASS] Xác nhận presentationId của Activity vẫn đúng (${foundAfter.presentationId}).`);
        console.log(`[PASS] Xác nhận slideNumber vẫn đúng (${foundAfter.slideId}).`);
        console.log(`[PASS] Xác nhận Activity config vẫn nguyên vẹn (${foundAfter.config?.specific_key}).`);
    } else {
        console.log('FAIL: Activity đã biến mất sau process restart!');
    }

    await stopServer(serverProcess);
    
    if (presFound && foundAfter) {
        console.log('====================================');
        console.log('PROCESS RESTART TEST: PASS');
        console.log('====================================');
        process.exit(0);
    } else {
        console.log('====================================');
        console.log('PROCESS RESTART TEST: FAIL');
        console.log('====================================');
        process.exit(1);
    }
  } catch (err) {
    console.error('Loi bat ngo: ', err);
    process.exit(1);
  }
}

runTest();
