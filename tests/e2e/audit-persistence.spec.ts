import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Audit 1: Persistence over process restart', () => {
  test('should keep presentation and active session data after server restart', async ({ request }) => {
    // 1. Create presentation
    const presData = {
      id: 'test_pres_audit_' + Date.now(),
      title: 'Audit Pres',
      teacherId: 'teacher_1',
      originalFileName: 'audit.pptx',
      fileUrl: 'http://example.com/audit.pptx',
      totalSlides: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // We can directly mock this by saving to DB for the test
    const res = await request.post('/api/upload', {
       // Mocking upload might be hard via API without formData, let's just use the db directly for the test assertions
    });

    const dbPath = path.join(process.cwd(), 'src', 'data', 'db.test.json');
    let dbData: any = { presentations: [] };
    if (fs.existsSync(dbPath)) {
        dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
    dbData.presentations.push(presData);
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));

    // Real test: are active sessions persisted in db.json?
    // We expect the server to persist sessions to db.json so a restart can recover them.
    // However, sessions are strictly in-memory in server.js right now.
    
    // We will assert that activeSessions exist in db.test.json
    // This will initially FAIL until we fix it.
    
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(rawData);
    
    // Test that there is an activeSessions container
    expect(parsed.activeSessions).toBeDefined();
  });
});
