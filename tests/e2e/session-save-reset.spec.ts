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
    if (!data.classes) {
      data.classes = [{ id: "CLS001", name: "Lớp 10A1", studentCount: 40 }];
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  });

  async function setupActiveSessionWithResponse(browser) {
    const teacherContext = await browser.newContext();
    const studentContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    const studentPage = await studentContext.newPage();

    console.log("Teacher creating session...");
    await teacherPage.goto('http://localhost:3000/teacher/presentations/test-pres-1');
    await teacherPage.waitForSelector('[data-testid="teacher-page"]');
    
    await teacherPage.locator('select').first().selectOption('CLS001');
    await teacherPage.waitForTimeout(1000);
    await teacherPage.click('button:has-text("Tạo phiên học")');

    const codeElement = await teacherPage.waitForSelector('span:has-text("Mã vào lớp:")');
    const text = await codeElement.textContent();
    const sessionCode = text?.replace('Mã vào lớp:', '').trim() || '';

    console.log("Student joining...");
    await studentPage.goto('http://localhost:3000/join');
    await studentPage.fill('input[placeholder="Ví dụ: 7K4P2"]', sessionCode);
    const studentId = '4866077784';
    await studentPage.fill('input[placeholder="Ví dụ: HS12345"]', studentId);
    await studentPage.click('button:has-text("Vào lớp")');
    await expect(studentPage.locator('text=Bạn đã vào lớp thành công')).toBeVisible();

    console.log("Launching activity...");
    for (let i = 0; i < 3; i++) {
      await teacherPage.locator('button.right-4').click();
      await teacherPage.waitForTimeout(500);
    }
    const startBtn = teacherPage.locator('button:has-text("Bắt đầu")');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    console.log("Submitting answer...");
    await expect(studentPage.locator('textarea')).toBeVisible();
    await studentPage.fill('textarea', 'My Test Answer');
    await studentPage.click('button:has-text("Gửi câu trả lời")');
    await expect(studentPage.locator('button', { hasText: /Đã Gửi/i })).toBeVisible();

    console.log("Giving score...");
    const openResultsBtn = teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').first();
    await expect(openResultsBtn).toBeVisible();
    await openResultsBtn.click();
    
    const scoreDropdown = teacherPage.locator('button:has-text("Duyệt điểm ▾")').first();
    await expect(scoreDropdown).toBeVisible();
    await scoreDropdown.hover();
    
    const approveAll = teacherPage.locator('button:has-text("Duyệt tất cả (Cộng 100%)")').first();
    await expect(approveAll).toBeVisible();
    await approveAll.click();
    await teacherPage.waitForTimeout(500);
    
    // Close the Results Modal
    await teacherPage.locator('button:has-text("Đóng")').dispatchEvent('click');
    await teacherPage.waitForTimeout(300);

    console.log("Setup complete!");
    return { teacherContext, studentContext, teacherPage, studentPage, sessionCode, studentId };
  }

  test('Test A: Full Save & Validate History Content', async ({ browser }) => {
    const { teacherContext, studentContext, teacherPage, studentPage, sessionCode, studentId } = await setupActiveSessionWithResponse(browser);

    // End Session and Save
    await teacherPage.locator('button:has-text("Kết thúc phiên")').dispatchEvent('click');
    await teacherPage.locator('button:has-text("LƯU VÀ KẾT THÚC")').dispatchEvent('click');

    // Wait for reset
    await expect(teacherPage.locator('select').first()).toBeVisible();
    await expect(studentPage.locator('text=Phiên học đã kết thúc')).toBeVisible({ timeout: 10000 });

    // Validate DB History
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbContent);
    expect(db.sessionHistories.length).toBe(1);
    
    const history = db.sessionHistories[0];
    expect(history.sessionCode).toBe(sessionCode);
    expect(history.classId).toBe('CLS001');
    expect(history.className).toBe('6/1');
    expect(history.status).toBe('COMPLETED');
    expect(history.completedAt).toBeGreaterThan(0);
    
    expect(history.activities.length).toBeGreaterThan(0);
    const actInfo = history.activities.find(a => a.activityType === 'SHORT_ANSWER');
    expect(actInfo).toBeTruthy();
    expect(actInfo.activityMode).toBe('INDIVIDUAL');
    expect(actInfo.maxScore).toBe(1);

    expect(history.students.length).toBeGreaterThanOrEqual(1);
    const st = history.students.find((s: any) => String(s.studentId) === studentId);
    expect(st).toBeDefined();
    expect(st.studentName).toBeTruthy();
    expect(st.sessionScore).toBe(1);
    expect(st.activityResults.length).toBe(1);
    
    const res = st.activityResults[0];
    expect(res.activityType).toBe('SHORT_ANSWER');
    expect(res.answer).toEqual(['My Test Answer']);
    expect(res.score).toBe(1);

    await teacherContext.close();
    await studentContext.close();
  });

  test('Test B: Session A saved -> reset -> create Session B', async ({ browser }) => {
    const { teacherContext, studentContext, teacherPage, studentPage, sessionCode } = await setupActiveSessionWithResponse(browser);

    // End Session A
    await teacherPage.locator('button:has-text("Kết thúc phiên")').dispatchEvent('click');
    await teacherPage.locator('button:has-text("LƯU VÀ KẾT THÚC")').dispatchEvent('click');
    await expect(teacherPage.locator('select').first()).toBeVisible();

    // Create Session B
    await teacherPage.locator('select').first().selectOption('CLS001');
    await teacherPage.waitForTimeout(1000);
    await teacherPage.click('button:has-text("Tạo phiên học")');
    const codeElement = await teacherPage.waitForSelector('span:has-text("Mã vào lớp:")');
    const text = await codeElement.textContent();
    const sessionCodeB = text?.replace('Mã vào lớp:', '').trim() || '';
    expect(sessionCodeB).toBeTruthy();
    expect(sessionCodeB).toBe(sessionCode);

    // Session A history is intact
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbContent);
    expect(db.sessionHistories.length).toBe(1);
    expect(db.sessionHistories[0].sessionCode).toBe(sessionCode);

    await teacherContext.close();
    await studentContext.close();
  });

  test('Test C: Tiếp tục dạy does not lose state', async ({ browser }) => {
    const { teacherContext, studentContext, teacherPage, studentPage, sessionCode } = await setupActiveSessionWithResponse(browser);

    await teacherPage.locator('button:has-text("Kết thúc phiên")').dispatchEvent('click');
    await teacherPage.locator('button:has-text("TIẾP TỤC DẠY")').dispatchEvent('click');

    // Dialog is hidden, session still active
    await expect(teacherPage.locator('text=Kết thúc phiên dạy')).toBeHidden();
    await expect(teacherPage.locator('span:has-text("Mã vào lớp:")')).toBeVisible();
    // Verify session is still active
    await expect(teacherPage.locator('button:has-text("Kết thúc phiên")')).toBeVisible();

    await teacherContext.close();
    await studentContext.close();
  });

  test('Test D: Discard Data (BỎ DỮ LIỆU) prevents history creation', async ({ browser }) => {
    const { teacherContext, studentContext, teacherPage, studentPage, sessionCode } = await setupActiveSessionWithResponse(browser);

    teacherPage.on('dialog', dialog => dialog.accept());
    await teacherPage.locator('button:has-text("Kết thúc phiên")').dispatchEvent('click');
    await teacherPage.locator('button:has-text("BỎ DỮ LIỆU")').dispatchEvent('click');

    await expect(teacherPage.locator('select').first()).toBeVisible();
    
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbContent);
    expect(db.sessionHistories.length).toBe(0);

    await teacherContext.close();
    await studentContext.close();
  });

  test('Test E: Save Failure Mutation (route.abort)', async ({ browser }) => {
    const { teacherContext, studentContext, teacherPage, studentPage, sessionCode } = await setupActiveSessionWithResponse(browser);

    // Force network failure for the HTTP request using route.abort()
    await teacherPage.route('/api/history', async route => {
      await route.abort('failed');
    });

    let alertMessage = '';
    teacherPage.on('dialog', dialog => {
      alertMessage = dialog.message();
      dialog.accept();
    });

    await teacherPage.locator('button:has-text("Kết thúc phiên")').dispatchEvent('click');
    await teacherPage.locator('button:has-text("LƯU VÀ KẾT THÚC")').dispatchEvent('click');

    await teacherPage.waitForTimeout(1000); 
    expect(alertMessage).toContain('Không thể lưu phiên dạy');

    // Current session NO RESET
    await expect(teacherPage.locator('span:has-text("Mã vào lớp:")')).toBeVisible();
    await expect(teacherPage.locator('text=Kết thúc phiên dạy')).toBeVisible(); // Dialog still open

    // Response and score still intact behind dialog
    await teacherPage.click('button:has-text("TIẾP TỤC DẠY")'); // Close dialog to check
    // Verify session is still active
    await expect(teacherPage.locator('button:has-text("Kết thúc phiên")')).toBeVisible();

    // Verify DB History not created
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbContent);
    expect(db.sessionHistories.length).toBe(0);

    await teacherContext.close();
    await studentContext.close();
  });
});

