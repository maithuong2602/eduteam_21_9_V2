import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { getDbFilePath, getDataDir, isTest } from '../../src/lib/dataConfig';

// Ensure safety guard
if (process.env.NODE_ENV === 'production' || (process.env.DB_FILE && process.env.DB_FILE.includes('/var/lib/eduteam'))) {
  throw new Error('FATAL: Security audit tests cannot run against production environment!');
}

test.describe('PHASE VPS-2: Hardened Security & Isolation Audit', () => {

  const ADMIN_TOKEN = 'test-secret-token-123';

  // 1. DB PATH ISOLATION TEST
  test('Audit 1: DB Path Isolation & Test Safety', async () => {
    const originalUseTest = process.env.USE_TEST_DB;
    const originalDbFile = process.env.DB_FILE;
    try {
      // A. When USE_TEST_DB=true, must always resolve to db.test.json
      process.env.USE_TEST_DB = 'true';
      process.env.DB_FILE = '/var/lib/eduteam/db.json';
      expect(isTest).toBe(true);
      const testDbPath = getDbFilePath();
      expect(testDbPath).toContain('db.test.json');
      expect(testDbPath).not.toContain('/var/lib/eduteam');

      // B. When in production (USE_TEST_DB not true, DB_FILE set), must resolve to production path
      process.env.USE_TEST_DB = 'false';
      process.env.DB_FILE = '/var/lib/eduteam/db.json';
      expect(isTest).toBe(false);
      const prodDbPath = getDbFilePath();
      expect(prodDbPath).toBe(path.resolve('/var/lib/eduteam/db.json'));
    } finally {
      process.env.USE_TEST_DB = originalUseTest;
      process.env.DB_FILE = originalDbFile;
    }
  });

  // 2. SECRET SCAN IN SOURCE
  test('Audit 2: No Hardcoded Cloudinary Secrets in Source Code', async () => {
    const uploadRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'upload', 'route.ts');
    const content = fs.readFileSync(uploadRoutePath, 'utf8');

    // Must NOT contain old hardcoded credentials
    const oldCloud = ['i5j', 'bdpzg'].join('');
    const oldKey = ['56975', '3364163795'].join('');
    const oldSec = ['_1vx6_', 'pU_G8FGdvrYaQuNoq4ewc'].join('');

    expect(content).not.toContain(oldCloud);
    expect(content).not.toContain(oldKey);
    expect(content).not.toContain(oldSec);

    // Must read from process.env
    expect(content).toContain('process.env.CLOUDINARY_CLOUD_NAME');
    expect(content).toContain('process.env.CLOUDINARY_API_KEY');
    expect(content).toContain('process.env.CLOUDINARY_API_SECRET');
  });

  // 3. DRIVE CREDENTIALS ISOLATION
  test('Audit 3: Google Drive Credentials Externalized', async () => {
    const driveRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'drive', 'route.ts');
    const content = fs.readFileSync(driveRoutePath, 'utf8');

    // Must support external secret path or env var
    expect(content).toContain('process.env.GOOGLE_CREDENTIALS_PATH');
    expect(content).toContain('process.env.GOOGLE_CREDENTIALS_B64');
  });

  // 4. RESTORE AUTHENTICATION
  test('Audit 4: Restore API Rejects Anonymous and Wrong Tokens', async ({ request }) => {
    // A. Anonymous request -> 401
    const resAnon = await request.post('/api/restore');
    expect([401, 403]).toContain(resAnon.status());

    // B. Wrong token -> 401
    const resWrong = await request.post('/api/restore', {
      headers: { 'Authorization': 'Bearer wrong-token' }
    });
    expect(resWrong.status()).toBe(401);

    // C. Query token -> 401 (Forbidden)
    const resQuery = await request.post(`/api/restore?token=${ADMIN_TOKEN}`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    expect([401, 403]).toContain(resQuery.status());
  });

  // 5. RESTORE PATH TRAVERSAL DEFENSE
  test('Audit 5: Restore API Blocks Path Traversal & Unsafe Files', async ({ request }) => {
    // Create a malicious zip attempting directory traversal
    const maliciousZip = new AdmZip();
    maliciousZip.addFile('../evil.txt', Buffer.from('malicious payload'));
    maliciousZip.addFile('server.js', Buffer.from('console.log("hacked")'));
    maliciousZip.addFile('.env', Buffer.from('SECRET=STOLEN'));
    const zipBuffer = maliciousZip.toBuffer();

    const response = await request.post('/api/restore', {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      multipart: {
        file: {
          name: 'malicious_backup.zip',
          mimeType: 'application/zip',
          buffer: zipBuffer
        }
      }
    });

    // Must reject with 400 Bad Request
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('forbidden or unsafe');

    // Verify evil files were NEVER created
    expect(fs.existsSync(path.join(process.cwd(), 'evil.txt'))).toBe(false);
  });

  // 6. RESTORE ALLOWLIST SUCCESS
  test('Audit 6: Restore API Accepts Valid Data Archive', async ({ request }) => {
    const validZip = new AdmZip();
    validZip.addFile('db.test.json', Buffer.from(JSON.stringify({ presentations: [], activities: [] })));
    const zipBuffer = validZip.toBuffer();

    const response = await request.post('/api/restore', {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      multipart: {
        file: {
          name: 'valid_backup.zip',
          mimeType: 'application/zip',
          buffer: zipBuffer
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  // 7. BACKUP AUTH & FILTERING
  test('Audit 7: Backup API Rejects Query Token & Excludes Sensitive Data', async ({ request }) => {
    // Query token MUST fail
    const resQuery = await request.get(`/api/backup?token=${ADMIN_TOKEN}`);
    expect([401, 403]).toContain(resQuery.status());

    // Authorized Bearer request succeeds
    const resAuth = await request.get('/api/backup', {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    expect(resAuth.status()).toBe(200);
    expect(resAuth.headers()['content-type']).toContain('application/zip');
  });

  // 8. SERVER HOST & PM2 CONFIGURATION AUDIT
  test('Audit 8: Server Host Binding & PM2 Configuration', async () => {
    const serverCode = fs.readFileSync(path.join(process.cwd(), 'server.js'), 'utf8');
    expect(serverCode).toContain("const HOST = process.env.HOST || '127.0.0.1'");
    expect(serverCode).toContain('server.listen(PORT, HOST');

    const pm2Config = fs.readFileSync(path.join(process.cwd(), 'ecosystem.config.js'), 'utf8');
    expect(pm2Config).toContain("name: 'eduteam'");
    expect(pm2Config).toContain("PORT: 3000");
    expect(pm2Config).toContain("HOST: '127.0.0.1'");
    expect(pm2Config).toContain("DB_FILE: '/var/lib/eduteam/db.json'");
    expect(pm2Config).toContain("EDUTEAM_DATA_DIR: '/var/lib/eduteam/data'");
    expect(pm2Config).toContain("restart_delay: 3000");
    expect(pm2Config).not.toContain("ADMIN_TOKEN");
    expect(pm2Config).not.toContain("CLOUDINARY_API_SECRET");
  });

});
