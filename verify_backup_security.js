const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const PORT = 3000;
const TEMP_DIR = path.join(__dirname, 'temp_backup_security');
const ZIP_PATH = path.join(TEMP_DIR, 'backup.zip');
const EXTRACT_DIR = path.join(TEMP_DIR, 'extracted');
const ADMIN_TOKEN = 'my-secret-token';

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function doRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks)
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      await doRequest({ hostname: 'localhost', port: PORT, path: '/', method: 'GET' });
      return;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Server did not start in time');
}

async function runTests() {
  const report = [];
  report.push("====================================");
  report.push("PHASE 1C.1 SECURITY TEST EVIDENCE");
  report.push("====================================");
  report.push("");

  let server;
  let allPass = true;

  try {
    // 2. KHỞI ĐỘNG SERVER TEST
    server = spawn('node', ['server.js'], {
      env: { ...process.env, ADMIN_TOKEN: ADMIN_TOKEN },
      stdio: 'ignore'
    });

    await waitForServer();

    // 3. TEST ANONYMOUS
    const anonRes = await doRequest({
      hostname: 'localhost', port: PORT, path: '/api/backup', method: 'GET'
    });
    const anonPass = anonRes.status === 401 && !anonRes.headers['content-type']?.includes('zip');
    report.push("1. Anonymous:");
    report.push(`STATUS: ${anonRes.status}`);
    report.push(`RESULT: ${anonPass ? 'PASS' : 'FAIL'}`);
    report.push("");
    if (!anonPass) allPass = false;

    // 4. TEST WRONG TOKEN
    const wrongRes = await doRequest({
      hostname: 'localhost', port: PORT, path: '/api/backup', method: 'GET',
      headers: { 'Authorization': 'Bearer wrong-token' }
    });
    const wrongPass = wrongRes.status === 401 && !wrongRes.headers['content-type']?.includes('zip');
    report.push("2. Wrong Token:");
    report.push(`STATUS: ${wrongRes.status}`);
    report.push(`RESULT: ${wrongPass ? 'PASS' : 'FAIL'}`);
    report.push("");
    if (!wrongPass) allPass = false;

    // 5. TEST CORRECT TOKEN
    const correctRes = await doRequest({
      hostname: 'localhost', port: PORT, path: '/api/backup', method: 'GET',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    let correctPass = correctRes.status === 200 && correctRes.headers['content-type']?.includes('zip');
    report.push("3. Correct Token:");
    report.push(`STATUS: ${correctRes.status}`);
    if (correctPass) {
      fs.writeFileSync(ZIP_PATH, correctRes.body);
      report.push(`ZIP: SAVED (${correctRes.body.length} bytes)`);
    } else {
      report.push(`ZIP: FAILED`);
    }
    report.push(`RESULT: ${correctPass ? 'PASS' : 'FAIL'}`);
    report.push("");
    if (!correctPass) allPass = false;

    // 6. KIỂM TRA NỘI DUNG ZIP & 7. KIỂM TRA DATABASE
    let zipPass = false;
    let dbPass = false;
    
    report.push("4. ZIP Content:");
    if (fs.existsSync(ZIP_PATH)) {
      const zip = new AdmZip(ZIP_PATH);
      zip.extractAllTo(EXTRACT_DIR, true);
      const entries = zip.getEntries().map(e => e.entryName);
      report.push(`FILES:\n  - ${entries.join('\n  - ')}`);

      const forbiddenPatterns = [
        /\.env/, /\.git/, /credential/i, /secret/i, /token/i,
        /private/i, /\.pem$/, /\.key$/, /\.tmp$/, /\.bak$/, /\.backup$/,
        /node_modules/
      ];
      
      const foundForbidden = entries.filter(e => {
        // Allow if it's db.test.json and we are in test mode (but we are not testing test mode here)
        if (e === 'db.test.json') return true; 
        return forbiddenPatterns.some(p => p.test(e));
      });

      if (foundForbidden.length > 0) {
        report.push(`FORBIDDEN FILES FOUND:\n  - ${foundForbidden.join('\n  - ')}`);
      } else {
        report.push(`FORBIDDEN FILES FOUND: NONE`);
        zipPass = true;
      }
      report.push(`RESULT: ${zipPass ? 'PASS' : 'FAIL'}`);
      report.push("");

      report.push("5. Database:");
      const dbPath = path.join(EXTRACT_DIR, 'data', 'db.json');
      if (fs.existsSync(dbPath)) {
        try {
          const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          report.push(`JSON VALID: YES`);
          report.push(`PRESENTATIONS: ${(dbData.presentations || []).length}`);
          report.push(`ACTIVITIES: ${(dbData.activities || []).length}`);
          dbPass = true;
        } catch (e) {
          report.push(`JSON VALID: NO (${e.message})`);
        }
      } else {
        report.push(`JSON VALID: NOT FOUND`);
      }
      report.push(`RESULT: ${dbPass ? 'PASS' : 'FAIL'}`);
      report.push("");

    } else {
      report.push(`FILES: NONE`);
      report.push(`FORBIDDEN FILES FOUND: NONE`);
      report.push(`RESULT: FAIL`);
      report.push("");
      report.push("5. Database:");
      report.push(`RESULT: FAIL`);
      report.push("");
    }
    if (!zipPass) allPass = false;
    if (!dbPass) allPass = false;

    // 9. KIỂM TRA QUERY TOKEN
    const queryWrongRes = await doRequest({
      hostname: 'localhost', port: PORT, path: '/api/backup?token=wrong-token', method: 'GET'
    });
    const queryCorrectRes = await doRequest({
      hostname: 'localhost', port: PORT, path: `/api/backup?token=${ADMIN_TOKEN}`, method: 'GET'
    });
    const queryPass = queryWrongRes.status === 401 && queryCorrectRes.status === 401;
    report.push("7. Query Token:");
    report.push(`RESULT: ${queryPass ? 'PASS' : 'FAIL (MUST BE DISABLED)'}`);
    report.push("");
    if (!queryPass) allPass = false;

  } finally {
    if (server) server.kill();
  }

  // 8. TEST ERROR LEAK (without ADMIN_TOKEN)
  let errorServer;
  try {
    errorServer = spawn('node', ['server.js'], {
      env: { ...process.env, ADMIN_TOKEN: '' },
      stdio: 'ignore'
    });
    await waitForServer();

    const errRes = await doRequest({
      hostname: 'localhost', port: PORT, path: '/api/backup', method: 'GET'
    });
    const bodyStr = errRes.body.toString();
    const isSafe = errRes.status === 403 && !bodyStr.includes('C:\\') && !bodyStr.includes('src/data') && !bodyStr.includes('db.json');
    report.push("6. Error Leak:");
    report.push(`RESULT: ${isSafe ? 'PASS' : 'FAIL'}`);
    report.push("");
    if (!isSafe) allPass = false;
  } finally {
    if (errorServer) errorServer.kill();
  }

  report.push("====================================");
  report.push(`AUTOMATED TEST RESULT: ${allPass ? 'PASS' : 'FAIL'}`);

  console.log(report.join('\n'));

  // 10. DỌN FILE TEST
  try {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  } catch(e) {}
}

runTests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
