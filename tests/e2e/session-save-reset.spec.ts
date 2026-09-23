import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Phase S1-B: Session Save and Reset', () => {
  const dbPath = path.resolve(__dirname, '../../src/data/db.test.json');

  test.beforeEach(async () => {
    // Reset only the session-related data in the test database before each test
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    let data = JSON.parse(dbContent);
    data.sessions = [];
    data.responses = {};
    data.sessionHistories = [];
    // Ensure we have a class to select
    if (!data.classes) {
      data.classes = [{ id: "CLS001", name: "Lớp 10A1", studentCount: 40 }];
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  });

  test('Test A, B, C, D: Save Session, Student Reset, Reset Teacher State, Validate History', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const studentContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    const studentPage = await studentContext.newPage();

    // 1. Teacher starts session
    await teacherPage.goto('http://localhost:3000/teacher/presentations/test-pres-1');
    await teacherPage.waitForSelector('[data-testid="teacher-page"]');
    
    await teacherPage.locator('select').first().selectOption('CLS001');
    await teacherPage.waitForTimeout(1000);
    await teacherPage.click('button:has-text("Tạo phiên học")');

    // Extract session code
    const codeElement = await teacherPage.waitForSelector('span:has-text("Mã vào lớp:")');
    const text = await codeElement.textContent();
    const sessionCode = text?.replace('Mã vào lớp:', '').trim() || '';
    expect(sessionCode).toBeTruthy();

    // 2. Student joins
    await studentPage.goto('http://localhost:3000/join');
    await studentPage.fill('input[placeholder="Ví dụ: 7K4P2"]', sessionCode);
    await studentPage.fill('input[placeholder="Ví dụ: HS12345"]', '4866077784');
    await studentPage.click('button:has-text("Vào lớp")');

    await expect(studentPage.locator('text=Bạn đã vào lớp thành công')).toBeVisible();

    // 3. Teacher triggers End Session Dialog
    await teacherPage.click('button:has-text("Kết thúc phiên")');
    await expect(teacherPage.locator('text=Kết thúc phiên dạy')).toBeVisible();

    // 4. Teacher selects LƯU VÀ KẾT THÚC
    await teacherPage.click('button:has-text("LƯU VÀ KẾT THÚC")');

    // 5. Test B: Student Reset - verify student page shows termination
    await expect(studentPage.locator('text=Phiên học đã kết thúc')).toBeVisible({ timeout: 10000 });
    
    // 6. Test C: Reset Teacher State - verify session code is gone and we can create a new session
    await expect(teacherPage.locator('span:has-text("Mã vào lớp:")')).toBeHidden();
    await expect(teacherPage.locator('select')).toBeVisible(); // Class selector is back

    // 7. Test D: Validate History Persistence
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbContent);
    expect(db.sessionHistories.length).toBe(1);
    const history = db.sessionHistories[0];
    expect(history.sessionCode).toBe(sessionCode);
    expect(history.className).toBe('6/1');
    expect(history.students.length).toBe(1);
    expect(history.students[0].studentName).toBeTruthy();

    await teacherContext.close();
    await studentContext.close();
  });

  test('Test E: Discard Data', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();

    // 1. Teacher starts session
    await teacherPage.goto('http://localhost:3000/teacher/presentations/test-pres-1');
    await teacherPage.waitForSelector('[data-testid="teacher-page"]');
    
    await teacherPage.locator('select').first().selectOption('CLS001');
    await teacherPage.waitForTimeout(1000);
    await teacherPage.click('button:has-text("Tạo phiên học")');

    // Automatically accept window.confirm
    teacherPage.on('dialog', dialog => dialog.accept());

    // 2. Trigger End Session
    await teacherPage.click('button:has-text("Kết thúc phiên")');
    
    // 3. Select BỎ DỮ LIỆU
    await teacherPage.click('button:has-text("BỎ DỮ LIỆU")');

    // Verify reset but NO persistence
    await expect(teacherPage.locator('select')).toBeVisible();
    
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbContent);
    expect(db.sessionHistories.length).toBe(0); // History is empty!

    await teacherContext.close();
  });

  test('Test F: Save Failure Mutation (No Reset)', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();

    // 1. Intercept POST /api/history and force failure (HTTP 500)
    await teacherPage.route('/api/history', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    // Handle alert dialog that pops up on save failure
    let alertMessage = '';
    teacherPage.on('dialog', dialog => {
      alertMessage = dialog.message();
      dialog.accept();
    });

    // 2. Teacher starts session
    await teacherPage.goto('http://localhost:3000/teacher/presentations/test-pres-1');
    await teacherPage.waitForSelector('[data-testid="teacher-page"]');
    
    await teacherPage.locator('select').first().selectOption('CLS001');
    await teacherPage.waitForTimeout(1000);
    await teacherPage.click('button:has-text("Tạo phiên học")');

    // Extract session code
    const codeElement = await teacherPage.waitForSelector('span:has-text("Mã vào lớp:")');
    const text = await codeElement.textContent();
    const sessionCode = text?.replace('Mã vào lớp:', '').trim() || '';

    // 3. Trigger End Session
    await teacherPage.click('button:has-text("Kết thúc phiên")');
    
    // 4. Select LƯU VÀ KẾT THÚC
    await teacherPage.click('button:has-text("LƯU VÀ KẾT THÚC")');

    // Verify alert happened
    await teacherPage.waitForTimeout(1000); // Wait for async fetch to finish and alert to trigger
    expect(alertMessage).toContain('Không thể lưu phiên dạy');

    // 5. Verify NO RESET (session code is still visible)
    await expect(teacherPage.locator('span:has-text("Mã vào lớp:")')).toBeVisible();
    expect(await teacherPage.locator('span:has-text("Mã vào lớp:")').textContent()).toContain(sessionCode);
    
    // Dialog should still be visible because we didn't close it on failure
    await expect(teacherPage.locator('text=Kết thúc phiên dạy')).toBeVisible();

    await teacherContext.close();
  });
});
