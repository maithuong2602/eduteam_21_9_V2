import { test, expect } from '@playwright/test';

test.describe('Score Persistence & Session Integrity (S2-B)', () => {
  let sessionCode = '';
  let teacherPage;
  let studentPage1;
  let studentPage2;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    teacherPage = await context.newPage();
    studentPage1 = await context.newPage();
    studentPage2 = await context.newPage();
  });

  test('Multi-Activity, Exact Score, and Student Isolation Persistence', async ({ request }) => {
    // 1. Teacher creates Session
    const presResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/presentations/test-pres-1') && res.status() === 200);
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await presResPromise;
    await expect(teacherPage.locator('[data-testid="teacher-page"]')).toBeVisible();

    const classResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/classes/') && res.status() === 200);
    await teacherPage.locator('select').first().selectOption('CLS001');
    await classResPromise;
    
    await teacherPage.waitForTimeout(1000);
    await teacherPage.locator('button:has-text("Tạo phiên học")').click();
    
    const codeLocator = teacherPage.locator('span:has-text("Mã vào lớp:")');
    await expect(codeLocator).toBeVisible();
    const fullText = await codeLocator.innerText();
    sessionCode = fullText.replace('Mã vào lớp:', '').trim();

    // 2. Student 1 joins
    await studentPage1.goto('/join');
    await studentPage1.locator('input').nth(0).fill(sessionCode);
    await studentPage1.locator('input').nth(1).fill('4869456649');
    await Promise.all([
      studentPage1.waitForURL(/\/student\/.+/),
      studentPage1.locator('button:has-text("Vào lớp")').click()
    ]);
    await expect(studentPage1.locator('text=/Xin chào/i')).toBeVisible();

    // 3. Student 2 joins
    await studentPage2.goto('/join');
    await studentPage2.locator('input').nth(0).fill(sessionCode);
    await studentPage2.locator('input').nth(1).fill('4824891635');
    await Promise.all([
      studentPage2.waitForURL(/\/student\/.+/),
      studentPage2.locator('button:has-text("Vào lớp")').click()
    ]);
    await expect(studentPage2.locator('text=/Xin chào/i')).toBeVisible();

    // -- ACTIVITY 1: MCQ (Slide 6) --
    // Go to slide 6 (from slide 1) => click Next 5 times
    for (let i = 0; i < 5; i++) {
      await teacherPage.locator('button.right-4').click();
      await teacherPage.waitForTimeout(500);
    }
    await expect(teacherPage.locator('text="Trắc nghiệm"')).toBeVisible();
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    await teacherPage.waitForTimeout(500);
    
    const unlockBtn = teacherPage.locator('button:has-text("Mở khóa hoạt động")');
    if (await unlockBtn.isVisible()) {
      await unlockBtn.click();
      await teacherPage.waitForTimeout(500);
    }
    
    // HS1 answers Option A (Correct)
    await expect(studentPage1.locator('button', { hasText: 'Option A' })).toBeVisible();
    await studentPage1.locator('button', { hasText: 'Option A' }).click();
    await studentPage1.locator('button', { hasText: 'Gửi đáp án' }).click();
    
    // HS2 answers Option B (Incorrect)
    await expect(studentPage2.locator('button', { hasText: 'Option A' })).toBeVisible();
    await studentPage2.locator('button', { hasText: 'Option B' }).click();
    await studentPage2.locator('button', { hasText: 'Gửi đáp án' }).click();
    
    await teacherPage.waitForTimeout(1000); // Wait for answers to reach teacher
    await expect(teacherPage.locator('text="2 phản hồi"')).toBeVisible();
    
    await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
    await teacherPage.locator('button', { hasText: 'Duyệt điểm' }).first().hover();
    await teacherPage.locator('button', { hasText: 'Duyệt đáp án đúng' }).first().click();
    await expect(teacherPage.locator('button:has-text("Đã duyệt điểm")').first()).toBeVisible();
    
    // Close modal
    await teacherPage.locator('button:has-text("Đóng")').click();

    // -- ACTIVITY 2: Short Answer (Slide 4) --
    // We are at Slide 6, go back to Slide 4 => click Prev 2 times
    for (let i = 0; i < 2; i++) {
      await teacherPage.locator('button.left-4').click();
      await teacherPage.waitForTimeout(500);
    }
    
    await expect(teacherPage.locator('text="Trả lời ngắn"')).toBeVisible();
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();

    await studentPage1.locator('textarea').fill('Test 1');
    await studentPage1.locator('button', { hasText: /Gửi Câu Trả Lời/i }).click();
    
    await teacherPage.waitForTimeout(1000); // Wait for answers to reach teacher
    await expect(teacherPage.locator('text="1 phản hồi"')).toBeVisible();
    
    await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
    await teacherPage.locator('button', { hasText: 'Duyệt điểm' }).first().hover();
    await teacherPage.locator('button', { hasText: 'Duyệt tất cả (Cộng 100%)' }).first().click();
    await expect(teacherPage.locator('button:has-text("Đã duyệt điểm")').first()).toBeVisible();
    
    // Close modal
    await teacherPage.locator('button:has-text("Đóng")').click();
    
    // -- END SESSION & SAVE --
    await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
    const postResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/history') && res.status() === 200);
    await teacherPage.locator('button:has-text("LƯU VÀ KẾT THÚC")').click();
    await postResPromise;

    // -- API VERIFICATION --
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(process.cwd(), 'src', 'data', 'db.test.json');
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbContent);
    
    const savedHistory = db.sessionHistories.find((h: any) => h.sessionCode === sessionCode);
    expect(savedHistory).toBeDefined();

    // Student Isolation
    const hs1 = savedHistory.students.find((s: any) => String(s.studentId) === '4869456649');
    const hs2 = savedHistory.students.find((s: any) => String(s.studentId) === '4824891635');
    
    expect(hs1).toBeDefined();
    expect(hs2).toBeDefined();

    // Check Multi-Activity persistence
    if (hs1.activityResults.length < 2) {
      console.log("DEBUG_FAIL hs1.activityResults: ", JSON.stringify(hs1.activityResults));
      console.log("DEBUG_FAIL db sessionHistory count: ", db.sessionHistories.length);
      console.log("DEBUG_FAIL savedHistory: ", JSON.stringify(savedHistory, null, 2));
    }
    expect(hs1.activityResults.length).toBeGreaterThanOrEqual(2);
    
    const shortAnswerResult = hs1.activityResults.find((a: any) => a.activityType === 'SHORT_ANSWER');
    expect(shortAnswerResult).toBeDefined();
    expect(shortAnswerResult.answer).toEqual(['Test 1']); // Raw answer preserved
    expect(shortAnswerResult.score).toBeGreaterThan(0); // Awarded because has response
    
    expect(hs1.sessionScore).toBeGreaterThan(0);
    expect(hs2.sessionScore).toBe(0); 
  });
});
