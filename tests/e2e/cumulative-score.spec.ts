import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Cumulative Score (S2-C)', () => {
  let teacherPage: any;
  let studentPage1: any;
  let studentPage2: any;
  let sessionCode = '';
  let student1Id = '4869456649';
  let student2Id = '4824891635';

  test.beforeEach(async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const studentContext1 = await browser.newContext();
    const studentContext2 = await browser.newContext();
    teacherPage = await teacherContext.newPage();
    studentPage1 = await studentContext1.newPage();
    studentPage2 = await studentContext2.newPage();
  });

  test('Calculate Cumulative Score Flow (Tests A-H)', async ({ request }) => {
    test.setTimeout(120000);

    // 1. Teacher starts session 1
    const presResPromise = teacherPage.waitForResponse((res: any) => res.url().includes('/api/presentations/test-pres-1') && res.status() === 200);
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await presResPromise;
    
    const classResPromise = teacherPage.waitForResponse((res: any) => res.url().includes('/api/classes/') && res.status() === 200);
    await teacherPage.locator('select').first().selectOption('CLS001');
    await classResPromise;
    
    await teacherPage.waitForTimeout(1000);
    await teacherPage.locator('button:has-text("Tạo phiên học")').click();

    const codeLocator = teacherPage.locator('span:has-text("Mã vào lớp:")');
    await expect(codeLocator).toBeVisible();
    sessionCode = (await codeLocator.innerText()).replace('Mã vào lớp:', '').trim();

    // 2. Students join
    await studentPage1.goto('/join');
    await studentPage1.locator('input').nth(0).fill(sessionCode);
    await studentPage1.locator('input').nth(1).fill(student1Id);
    await Promise.all([
      studentPage1.waitForURL(/\/student\/.+/),
      studentPage1.locator('button:has-text("Vào lớp")').click()
    ]);

    await studentPage2.goto('/join');
    await studentPage2.locator('input').nth(0).fill(sessionCode);
    await studentPage2.locator('input').nth(1).fill(student2Id);
    await Promise.all([
      studentPage2.waitForURL(/\/student\/.+/),
      studentPage2.locator('button:has-text("Vào lớp")').click()
    ]);

    // -- ACTIVITY 1: MCQ --
    for (let i = 0; i < 5; i++) {
      await teacherPage.locator('button.right-4').click();
      await teacherPage.waitForTimeout(500);
    }
    
    await expect(teacherPage.locator('text="Trắc nghiệm"')).toBeVisible();
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    
    await studentPage1.locator('button', { hasText: 'Option A' }).click();
    await studentPage1.locator('button', { hasText: 'Gửi đáp án' }).click();
    
    await studentPage2.locator('button', { hasText: 'Option B' }).click();
    await studentPage2.locator('button', { hasText: 'Gửi đáp án' }).click();
    
    await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
    await teacherPage.locator('button', { hasText: 'Duyệt điểm' }).first().hover();
    await teacherPage.locator('button', { hasText: 'Duyệt đáp án đúng' }).first().click();
    await teacherPage.locator('button:has-text("Đóng")').click();

    // -- Test C: Active Session Excluded --
    // Verify cumulative is 0 before saving
    let getRes = await request.get(`/api/cumulative-score?classId=CLS001`);
    let getBody = await getRes.json();
    let resS1 = getBody.results.find((r: any) => String(r.studentId) === student1Id);
    expect(resS1?.cumulativeScore || 0).toBe(0);

    // -- END SESSION 1 & SAVE --
    await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
    
    // Test H: Discard session check (Not directly doing discarding here as we need to save for other tests,
    // but the S1-B test handles discard behavior. We will focus on A-G)
    
    let postResPromise = teacherPage.waitForResponse((res: any) => res.url().includes('/api/history') && res.status() === 200);
    await teacherPage.locator('button:has-text("LƯU VÀ KẾT THÚC")').click();
    await postResPromise;

    // -- API VERIFICATION AFTER SAVE (Test A & D) --
    getRes = await request.get(`/api/cumulative-score?classId=CLS001`);
    getBody = await getRes.json();
    
    resS1 = getBody.results.find((r: any) => String(r.studentId) === student1Id);
    const resS2 = getBody.results.find((r: any) => String(r.studentId) === student2Id);
    
    expect(resS1).toBeDefined();
    expect(resS1.cumulativeScore).toBe(1); // Student 1 got 1 point (Option A correct)
    
    // Student 2 got 0 points (Option B incorrect)
    expect(resS2).toBeDefined();
    expect(resS2.cumulativeScore).toBe(0);

    // -- Test G: Repeated Calculation --
    let getRes2 = await request.get(`/api/cumulative-score?classId=CLS001`);
    let getBody2 = await getRes2.json();
    let resS1_2 = getBody2.results.find((r: any) => String(r.studentId) === student1Id);
    expect(resS1_2.cumulativeScore).toBe(1); // Same result

    // -- START SESSION 2 (Test B) --
    const presResPromise2 = teacherPage.waitForResponse((res: any) => res.url().includes('/api/presentations/test-pres-1') && res.status() === 200);
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await presResPromise2;

    const classResPromise2 = teacherPage.waitForResponse((res: any) => res.url().includes('/api/classes/') && res.status() === 200);
    await teacherPage.locator('select').first().selectOption('CLS001');
    await classResPromise2;
    
    await teacherPage.waitForTimeout(1000);
    await teacherPage.locator('button:has-text("Tạo phiên học")').click();
    
    const codeLocator2 = teacherPage.locator('span:has-text("Mã vào lớp:")');
    await expect(codeLocator2).toBeVisible();
    let sessionCode2 = (await codeLocator2.innerText()).replace('Mã vào lớp:', '').trim();

    await studentPage1.goto('/join');
    await studentPage1.locator('input').nth(0).fill(sessionCode2);
    await studentPage1.locator('input').nth(1).fill(student1Id);
    await Promise.all([
      studentPage1.waitForURL(/\/student\/.+/),
      studentPage1.locator('button:has-text("Vào lớp")').click()
    ]);

    // ACTIVITY in Session 2: Short Answer
    for (let i = 0; i < 3; i++) {
      await teacherPage.locator('button.right-4').click();
      await teacherPage.waitForTimeout(500);
    }
    await expect(teacherPage.locator('text="Trả lời ngắn"')).toBeVisible();
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    
    await studentPage1.locator('textarea').fill('Test 2');
    await studentPage1.locator('button', { hasText: /Gửi Câu Trả Lời/i }).click();

    await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
    await teacherPage.locator('button', { hasText: 'Duyệt điểm' }).first().hover();
    await teacherPage.locator('button', { hasText: 'Duyệt tất cả' }).first().click();
    await teacherPage.locator('button:has-text("Đóng")').click();

    // -- END SESSION 2 & SAVE --
    await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
    postResPromise = teacherPage.waitForResponse((res: any) => res.url().includes('/api/history') && res.status() === 200);
    await teacherPage.locator('button:has-text("LƯU VÀ KẾT THÚC")').click();
    await postResPromise;

    // -- VERIFY CUMULATIVE SCORE AFTER SESSION 2 (Test B) --
    getRes = await request.get(`/api/cumulative-score?classId=CLS001`);
    getBody = await getRes.json();
    resS1 = getBody.results.find((r: any) => String(r.studentId) === student1Id);
    
    expect(resS1.cumulativeScore).toBe(2); // 1 from Session 1 + 1 from Session 2
    expect(resS1.completedSessionCount).toBe(2);
  });
});
