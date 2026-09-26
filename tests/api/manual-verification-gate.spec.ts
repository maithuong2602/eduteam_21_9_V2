import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';

if (process.env.NODE_ENV === 'production' || (process.env.DB_FILE && process.env.DB_FILE.includes('/var/lib/eduteam'))) {
  throw new Error('FATAL: Tests forbidden from running against production!');
}

test.describe('TEST 3 & TEST 4: Manual Verification Gate Specs', () => {

  const ADMIN_TOKEN = 'test-secret-token-123';

  // ==========================================
  // TEST 3: ADMIN_TOKEN AUTHENTICATION MATRIX
  // ==========================================
  test('TEST 3.1: /api/backup Auth Matrix (Anonymous, Wrong Token, Query Token, Bearer)', async ({ request }) => {
    // 1. Không Authorization header -> 401/403
    const resNoAuth = await request.get('/api/backup');
    expect([401, 403]).toContain(resNoAuth.status());
    expect(resNoAuth.headers()['content-type'] || '').not.toContain('application/zip');

    // 2. Bearer token sai -> 401
    const resWrong = await request.get('/api/backup', {
      headers: { 'Authorization': 'Bearer wrong-secret-token' }
    });
    expect(resWrong.status()).toBe(401);

    // 3. Query token -> 401/403
    const resQuery = await request.get(`/api/backup?token=${ADMIN_TOKEN}`);
    expect([401, 403]).toContain(resQuery.status());

    // 4. Bearer token đúng -> 200 OK + ZIP
    const resValid = await request.get('/api/backup', {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    expect(resValid.status()).toBe(200);
    expect(resValid.headers()['content-type']).toContain('application/zip');
  });

  test('TEST 3.2: /api/restore Auth Matrix (Anonymous, Wrong Token, Query Token)', async ({ request }) => {
    const dummyZip = new AdmZip();
    dummyZip.addFile('db.test.json', Buffer.from(JSON.stringify({ test: true })));
    const buffer = dummyZip.toBuffer();

    // 1. Không Authorization header -> 401/403
    const resNoAuth = await request.post('/api/restore', {
      multipart: { file: { name: 'test.zip', mimeType: 'application/zip', buffer } }
    });
    expect([401, 403]).toContain(resNoAuth.status());

    // 2. Bearer token sai -> 401
    const resWrong = await request.post('/api/restore', {
      headers: { 'Authorization': 'Bearer wrong-secret-token' },
      multipart: { file: { name: 'test.zip', mimeType: 'application/zip', buffer } }
    });
    expect(resWrong.status()).toBe(401);

    // 3. Query token -> 401/403
    const resQuery = await request.post(`/api/restore?token=${ADMIN_TOKEN}`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      multipart: { file: { name: 'test.zip', mimeType: 'application/zip', buffer } }
    });
    expect([401, 403]).toContain(resQuery.status());
  });

  // ==========================================
  // TEST 4: RESTORE ARCHIVE DEEP SECURITY
  // ==========================================
  test('TEST 4.1: Path Traversal Archive (../evil.txt) MUST be rejected with 400', async ({ request }) => {
    const zip = new AdmZip();
    zip.addFile('../evil.txt', Buffer.from('escape attempt'));
    const response = await request.post('/api/restore', {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      multipart: { file: { name: 'traversal.zip', mimeType: 'application/zip', buffer: zip.toBuffer() } }
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('forbidden or unsafe');
    expect(fs.existsSync('evil.txt')).toBe(false);
  });

  test('TEST 4.2: Forbidden System Files (.env, server.js, package.json) MUST be rejected with 400', async ({ request }) => {
    // A. .env
    const zipEnv = new AdmZip();
    zipEnv.addFile('.env', Buffer.from('SECRET=COMPROMISED'));
    const resEnv = await request.post('/api/restore', {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      multipart: { file: { name: 'env.zip', mimeType: 'application/zip', buffer: zipEnv.toBuffer() } }
    });
    expect(resEnv.status()).toBe(400);

    // B. server.js
    const zipServer = new AdmZip();
    zipServer.addFile('server.js', Buffer.from('console.log("malicious code")'));
    const resServer = await request.post('/api/restore', {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      multipart: { file: { name: 'server.zip', mimeType: 'application/zip', buffer: zipServer.toBuffer() } }
    });
    expect(resServer.status()).toBe(400);

    // C. package.json
    const zipPkg = new AdmZip();
    zipPkg.addFile('package.json', Buffer.from('{}'));
    const resPkg = await request.post('/api/restore', {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      multipart: { file: { name: 'pkg.zip', mimeType: 'application/zip', buffer: zipPkg.toBuffer() } }
    });
    expect(resPkg.status()).toBe(400);
  });

  test('TEST 4.3: Private Key & Files Outside Allowlist MUST be rejected with 400', async ({ request }) => {
    // A. private.key
    const zipKey = new AdmZip();
    zipKey.addFile('cert.key', Buffer.from('private key payload'));
    const resKey = await request.post('/api/restore', {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      multipart: { file: { name: 'key.zip', mimeType: 'application/zip', buffer: zipKey.toBuffer() } }
    });
    expect(resKey.status()).toBe(400);

    // B. Non-allowlisted file (random.csv)
    const zipNonAllow = new AdmZip();
    zipNonAllow.addFile('data.csv', Buffer.from('a,b,c'));
    const resNonAllow = await request.post('/api/restore', {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      multipart: { file: { name: 'random.zip', mimeType: 'application/zip', buffer: zipNonAllow.toBuffer() } }
    });
    expect(resNonAllow.status()).toBe(400);
  });

  test('TEST 4.4: Valid Archive & Atomic Replacement / Rollback', async ({ request }) => {
    // 1. Valid Archive -> 200 OK
    const validZip = new AdmZip();
    const validDbContent = { presentations: [], activities: [], classCodes: [{ classId: 'TEST_RESTORE', code: 'RE1234' }] };
    validZip.addFile('db.test.json', Buffer.from(JSON.stringify(validDbContent)));
    const resValid = await request.post('/api/restore', {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      multipart: { file: { name: 'valid.zip', mimeType: 'application/zip', buffer: validZip.toBuffer() } }
    });
    expect(resValid.status()).toBe(200);
    const bodyValid = await resValid.json();
    expect(bodyValid.success).toBe(true);
    expect(bodyValid.atomicReplacement).toBe(true);

    // 2. Corrupted JSON Archive -> Rejected with 400 without corrupting target
    const corruptZip = new AdmZip();
    corruptZip.addFile('db.test.json', Buffer.from('{ corrupt json content ...'));
    const resCorrupt = await request.post('/api/restore', {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      multipart: { file: { name: 'corrupt.zip', mimeType: 'application/zip', buffer: corruptZip.toBuffer() } }
    });
    expect(resCorrupt.status()).toBe(400);
    const bodyCorrupt = await resCorrupt.json();
    expect(bodyCorrupt.error).toContain('corrupted');

    // Verify existing db.test.json remains intact and parsable
    const testDbRaw = fs.readFileSync('src/data/db.test.json', 'utf8');
    expect(() => JSON.parse(testDbRaw)).not.toThrow();
  });

});
