import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Group Mode Automation Tests', () => {
  test('Group Mode core flows (G-MODE-01 to G-MODE-16)', async ({ browser, request }) => {
    // Teacher sets up session
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    // Simulate teacher login and session creation
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await teacherPage.locator('select').first().selectOption('CLS001');
    await teacherPage.locator('button:has-text("Tạo phiên học")').click();
    const codeLocator = teacherPage.locator('span:has-text("Mã vào lớp:")');
    await expect(codeLocator).toBeVisible();
    const fullText = await codeLocator.innerText();
    const sessionCode = fullText.replace('Mã vào lớp:', '').trim();

    // Set up groups
    await teacherPage.locator('button:has-text("Quản lý nhóm")').click();
    await teacherPage.locator('button:has-text("Tạo 2 nhóm")').click();
    await teacherPage.locator('button:has-text("Lưu")').click();
    await teacherPage.locator('button:has-text("Đóng")').click();

    // Student A and B join Group 1, Student C joins Group 2
    const studentAContext = await browser.newContext();
    const studentAPage = await studentAContext.newPage();
    await studentAPage.goto('/join');
    await studentAPage.locator('input').nth(0).fill(sessionCode);
    await studentAPage.locator('input').nth(1).fill('4869456649'); // HS001
    await Promise.all([
      studentAPage.waitForURL(/\/student\/.+/),
      studentAPage.locator('button:has-text("Vào lớp")').click()
    ]);
    // Join Group 1
    await studentAPage.locator('button:has-text("Tra cứu danh sách nhóm")').click();
    await studentAPage.locator('text=Nhóm 1').click();
    await studentAPage.locator('button:has-text("Tham gia Nhóm 1")').click();
    await studentAPage.locator('button:has-text("Đóng")').click();

    const studentBContext = await browser.newContext();
    const studentBPage = await studentBContext.newPage();
    await studentBPage.goto('/join');
    await studentBPage.locator('input').nth(0).fill(sessionCode);
    await studentBPage.locator('input').nth(1).fill('4824891635'); // HS002
    await Promise.all([
      studentBPage.waitForURL(/\/student\/.+/),
      studentBPage.locator('button:has-text("Vào lớp")').click()
    ]);
    await studentBPage.locator('button:has-text("Tra cứu danh sách nhóm")').click();
    await studentBPage.locator('text=Nhóm 1').click();
    await studentBPage.locator('button:has-text("Tham gia Nhóm 1")').click();
    await studentBPage.locator('button:has-text("Đóng")').click();

    const studentCContext = await browser.newContext();
    const studentCPage = await studentCContext.newPage();
    await studentCPage.goto('/join');
    await studentCPage.locator('input').nth(0).fill(sessionCode);
    await studentCPage.locator('input').nth(1).fill('4832599760'); // HS003
    await Promise.all([
      studentCPage.waitForURL(/\/student\/.+/),
      studentCPage.locator('button:has-text("Vào lớp")').click()
    ]);
    await studentCPage.locator('button:has-text("Tra cứu danh sách nhóm")').click();
    await studentCPage.locator('text=Nhóm 2').click();
    await studentCPage.locator('button:has-text("Tham gia Nhóm 2")').click();
    await studentCPage.locator('button:has-text("Đóng")').click();

    // Teacher changes slide to Multiple Choice
    for (let i = 0; i < 5; i++) {
      await teacherPage.locator('button.right-4').click();
      await teacherPage.waitForTimeout(400);
    }
    
    // Choose Group mode
    await teacherPage.locator('label', { hasText: 'Theo nhóm' }).click();
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();

    // Verify activity mode is GROUP on student UI (the individual submit should be hidden)
    await expect(studentAPage.locator('button:has-text("Nộp bài")')).toBeHidden();
    
    // Student A selects Option A
    await studentAPage.locator('button', { hasText: 'Option A' }).click();
    
    // Check if Student B sees the selection (real-time workspace sync)
    await expect(studentBPage.locator('button:has-text("Option A")')).toHaveClass(/border-blue-500|border-blue-400|bg-blue-50/);

    // Student B clicks Submit Group
    studentBPage.once('dialog', dialog => dialog.accept());
    await studentBPage.locator('button:has-text("Gửi đáp án của nhóm")').click();
    
    // Check UI for Student A
    await expect(studentAPage.locator('text=Nhóm đã gửi')).toBeVisible();

    // Teacher sees 1 response (from Group 1)
    await expect(teacherPage.locator('span', { hasText: '1 phản hồi' })).toBeVisible();

    // Student C in Group 2 selects Option B and submits
    await studentCPage.locator('button', { hasText: 'Option B' }).click();
    studentCPage.once('dialog', dialog => dialog.accept());
    await studentCPage.locator('button:has-text("Gửi đáp án của nhóm")').click();

    // Teacher sees 2 responses
    await expect(teacherPage.locator('span', { hasText: '2 phản hồi' })).toBeVisible();

    // Teacher Approves Option A
    await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
    await teacherPage.locator('button', { hasText: 'Duyệt Đáp án đúng' }).first().click(); // Approving Group 1 (Option A)

    // Verify Points logic (A=1, B=1, Group=1)
    await teacherPage.locator('button:has-text("Đóng")').click();
    
    // Check leaderboard
    await expect(studentAPage.locator('div.text-green-600:has-text("+1")')).toBeVisible();
    await expect(studentBPage.locator('div.text-green-600:has-text("+1")')).toBeVisible();
    
    // End session
    await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
    const postResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/history') && res.status() === 200);
    await teacherPage.locator('button:has-text("LƯU VÀ KẾT THÚC")').click();
    await postResPromise;

    // Check DB history
    const dbPath = path.join(process.cwd(), 'src', 'data', 'db.test.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const saved = db.sessionHistories.find((h: any) => h.sessionCode === sessionCode);
    
    // Student A history
    const hsA = saved.students.find((s: any) => String(s.studentId) === '4869456649');
    expect(hsA.sessionScore).toBe(1);
    expect(hsA.activityResults[0].groupId).toBeDefined();

    // Student B history
    const hsB = saved.students.find((s: any) => String(s.studentId) === '4824891635');
    expect(hsB.sessionScore).toBe(1);

    // Student C history
    const hsC = saved.students.find((s: any) => String(s.studentId) === '4832599760');
    expect(hsC.sessionScore).toBe(0);

    await teacherContext.close();
    await studentAContext.close();
    await studentBContext.close();
    await studentCContext.close();
  });
});
