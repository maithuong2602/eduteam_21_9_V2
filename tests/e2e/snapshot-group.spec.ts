import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Group Mode Snapshot Automation Tests', () => {
  test('Group Mode Snapshot flows (SNAPSHOT-01 to SNAPSHOT-03)', async ({ browser, request }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    // 1. Teacher sets up session
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await teacherPage.locator('select').first().selectOption('CLS001');
    await teacherPage.locator('button:has-text("Tạo phiên học")').click();
    const codeLocator = teacherPage.locator('span:has-text("Mã vào lớp:")');
    await expect(codeLocator).toBeVisible();
    const sessionCode = (await codeLocator.innerText()).replace('Mã vào lớp:', '').trim();

    // 2. Set up groups
    await teacherPage.locator('button:has-text("Quản lý nhóm")').click();
    await teacherPage.locator('button:has-text("Tạo 2 nhóm")').click();
    await teacherPage.locator('button:has-text("Lưu")').click();
    await teacherPage.locator('button:has-text("Đóng")').click();

    // 3. Students Join
    const studentAContext = await browser.newContext();
    const studentAPage = await studentAContext.newPage();
    await studentAPage.goto('/join');
    await studentAPage.locator('input').nth(0).fill(sessionCode);
    await studentAPage.locator('input').nth(1).fill('4869456649'); // HS001 (A)
    await Promise.all([studentAPage.waitForURL(/\/student\/.+/), studentAPage.locator('button:has-text("Vào lớp")').click()]);
    await studentAPage.locator('button:has-text("Tra cứu danh sách nhóm")').click();
    await studentAPage.locator('text=Nhóm 1').click();
    await studentAPage.locator('button:has-text("Tham gia Nhóm 1")').click();
    await studentAPage.locator('button:has-text("Đóng")').click();

    const studentBContext = await browser.newContext();
    const studentBPage = await studentBContext.newPage();
    await studentBPage.goto('/join');
    await studentBPage.locator('input').nth(0).fill(sessionCode);
    await studentBPage.locator('input').nth(1).fill('4824891635'); // HS002 (B)
    await Promise.all([studentBPage.waitForURL(/\/student\/.+/), studentBPage.locator('button:has-text("Vào lớp")').click()]);
    await studentBPage.locator('button:has-text("Tra cứu danh sách nhóm")').click();
    await studentBPage.locator('text=Nhóm 1').click();
    await studentBPage.locator('button:has-text("Tham gia Nhóm 1")').click();
    await studentBPage.locator('button:has-text("Đóng")').click();

    const studentCContext = await browser.newContext();
    const studentCPage = await studentCContext.newPage();
    await studentCPage.goto('/join');
    await studentCPage.locator('input').nth(0).fill(sessionCode);
    await studentCPage.locator('input').nth(1).fill('4832599760'); // HS003 (C)
    await Promise.all([studentCPage.waitForURL(/\/student\/.+/), studentCPage.locator('button:has-text("Vào lớp")').click()]);
    await studentCPage.locator('button:has-text("Tra cứu danh sách nhóm")').click();
    await studentCPage.locator('text=Nhóm 2').click();
    await studentCPage.locator('button:has-text("Tham gia Nhóm 2")').click();
    await studentCPage.locator('button:has-text("Đóng")').click();

    // 4. Start Activity in Group Mode
    for (let i = 0; i < 5; i++) {
      await teacherPage.locator('button.right-4').click();
      await teacherPage.waitForTimeout(400);
    }
    await teacherPage.locator('label', { hasText: 'Theo nhóm' }).click();
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();

    // 5. Group 1 Submits (A + B)
    await studentAPage.locator('button', { hasText: 'Option A' }).click();
    studentAPage.once('dialog', dialog => dialog.accept());
    await studentAPage.locator('button:has-text("Gửi đáp án của nhóm")').click();
    await expect(teacherPage.locator('span', { hasText: '1 phản hồi' })).toBeVisible();

    // 6. SNAPSHOT-01 & 03: Move Student A to Group 2 AFTER submit but BEFORE approve
    await studentAPage.locator('button:has-text("Tra cứu danh sách nhóm")').click();
    await studentAPage.locator('text=Nhóm 2').click();
    await studentAPage.locator('button:has-text("Tham gia Nhóm 2")').click();
    await studentAPage.locator('button:has-text("Đóng")').click();

    // 7. Approve Group 1
    await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
    await teacherPage.locator('button', { hasText: 'Duyệt Đáp án đúng' }).first().click(); // Approving Group 1 (Option A)
    await teacherPage.locator('button:has-text("Đóng")').click();

    // 8. Verify A and B both received points (Snapshot preserved A in Group 1)
    await expect(studentAPage.locator('div.text-green-600:has-text("+1")')).toBeVisible();
    await expect(studentBPage.locator('div.text-green-600:has-text("+1")')).toBeVisible();

    // 9. End Session & Verify History
    await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
    const postResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/history') && res.status() === 200);
    await teacherPage.locator('button:has-text("LƯU VÀ KẾT THÚC")').click();
    await postResPromise;

    const dbPath = path.join(process.cwd(), 'src', 'data', 'db.test.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const saved = db.sessionHistories.find((h: any) => h.sessionCode === sessionCode);
    
    const hsA = saved.students.find((s: any) => String(s.studentId) === '4869456649');
    const hsB = saved.students.find((s: any) => String(s.studentId) === '4824891635');
    const hsC = saved.students.find((s: any) => String(s.studentId) === '4832599760');

    expect(hsA.sessionScore).toBe(1);
    expect(hsA.activityResults[0].groupName).toContain('Nhóm 1'); // History locked to Group 1
    expect(hsB.sessionScore).toBe(1);
    expect(hsC.sessionScore).toBe(0);

    // 10. Verify Cumulative Impact
    const cumRes = await request.get(`/api/cumulative-score?classId=CLS001`);
    const cumBody = await cumRes.json();
    const cumHsA = cumBody.results.find((r: any) => String(r.studentId) === '4869456649');
    expect(cumHsA.cumulativeScore).toBeGreaterThanOrEqual(1);

    await teacherContext.close();
    await studentAContext.close();
    await studentBContext.close();
    await studentCContext.close();
  });
});
