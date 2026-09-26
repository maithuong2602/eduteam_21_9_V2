import { test, expect } from '@playwright/test';
import fs from 'fs';
import AdmZip from 'adm-zip';

// Safety Guard: Abort immediately if run against production
if (process.env.NODE_ENV === 'production' || (process.env.DB_FILE && process.env.DB_FILE.includes('/var/lib/eduteam'))) {
  throw new Error('FATAL: Tests are strictly forbidden from running in production or against production DB_FILE!');
}

test.describe('Backup Security API', () => {
  
  test('TEST 1: Anonymous request should fail or reject', async ({ request }) => {
    const response = await request.get('/api/backup');
    
    // Expect 403 or 401
    expect([403, 401]).toContain(response.status());
    
    // Đảm bảo không trả về ZIP
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).not.toContain('application/zip');
  });

  test('TEST 2: Unauthorized request (wrong token) should fail', async ({ request }) => {
    const response = await request.get('/api/backup', {
      headers: {
        'Authorization': `Bearer wrong-token`
      }
    });
    
    // Expect 401 Unauthorized
    expect(response.status()).toBe(401);
    
    // Đảm bảo không trả về ZIP
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).not.toContain('application/zip');
  });

  test('TEST 4: Correct Query Token MUST fail (disabled)', async ({ request }) => {
    const adminToken = 'test-secret-token-123';
    const response = await request.get(`/api/backup?token=${adminToken}`);
    expect([403, 401]).toContain(response.status());
  });

  test('TEST 5: Wrong Query Token MUST fail', async ({ request }) => {
    const response = await request.get('/api/backup?token=wrong-token');
    expect([403, 401]).toContain(response.status());
  });

  test('TEST 3 & TEST 6: Authorized request should succeed and return safe ZIP content', async ({ request }) => {
    const adminToken = 'test-secret-token-123';
    
    // Tạo dummy files trong thư mục test mà KHÔNG BAO GIỜ chạm vào src/data/db.json
    if (!fs.existsSync('src/data')) {
      fs.mkdirSync('src/data', { recursive: true });
    }
    // Ghi vào db.test.json thay vì db.json
    fs.writeFileSync('src/data/db.test.json', JSON.stringify({ testDb: true, presentations: [] }));
    fs.writeFileSync('src/data/.env', 'SECRET=123');
    fs.writeFileSync('src/data/test.tmp', 'temp data');
    
    const response = await request.get(`/api/backup`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    // Phải trả về 200 OK
    expect(response.status()).toBe(200);
    
    // Phải là file ZIP
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/zip');
    
    // Kiểm tra nội dung ZIP
    const buffer = await response.body();
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const fileNames = zipEntries.map(entry => entry.entryName);
    
    // TUYỆT ĐỐI KHÔNG chứa file nhạy cảm
    expect(fileNames.some(name => name.includes('.env'))).toBeFalsy();
    expect(fileNames.some(name => name.includes('.tmp'))).toBeFalsy();
    
    // Clean up dummy test files
    if (fs.existsSync('src/data/.env')) fs.unlinkSync('src/data/.env');
    if (fs.existsSync('src/data/test.tmp')) fs.unlinkSync('src/data/test.tmp');
  });

});
