import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('PHASE SCORE-1 Comprehensive Verification (H, I, J, P, Q, T)', () => {
  test.beforeEach(async ({ request }) => {
    await request.get('/api/test/reset');
  });

  test('Flow: Offline student approval, idempotent approval, save vs discard, and authoritative score verification', async ({ browser, request }) => {
    test.setTimeout(120000);

    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    const studentContext1 = await browser.newContext();
    const studentPage1 = await studentContext1.newPage();

    const studentContext2 = await browser.newContext();
    const studentPage2 = await studentContext2.newPage();

    // 1. Teacher creates session & selects class CLS001
    const presResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/presentations/test-pres-1') && res.status() === 200);
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await presResPromise;
    await expect(teacherPage.locator('[data-testid="teacher-page"]')).toBeVisible();

    const classResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/classes/') && res.status() === 200);
    await teacherPage.locator('select').first().selectOption('CLS001');
    await classResPromise;

    await teacherPage.locator('button:has-text("Tạo phiên học")').click();
    const codeLocator = teacherPage.locator('span:has-text("Mã vào lớp:")');
    await expect(codeLocator).toBeVisible();
    const fullText = await codeLocator.innerText();
    const sessionCode = fullText.replace('Mã vào lớp:', '').trim();

    // 2. Student 1 (HS001 / 4869456649) and Student 2 (HS002 / 4824891635) join
    await studentPage1.goto('/join');
    await studentPage1.locator('input').nth(0).fill(sessionCode);
    await studentPage1.locator('input').nth(1).fill('4869456649');
    await Promise.all([
      studentPage1.waitForURL(/\/student\/.+/),
      studentPage1.locator('button:has-text("Vào lớp")').click()
    ]);
    await expect(studentPage1.locator('text=/Xin chào/i')).toBeVisible();

    await studentPage2.goto('/join');
    await studentPage2.locator('input').nth(0).fill(sessionCode);
    await studentPage2.locator('input').nth(1).fill('4824891635');
    await Promise.all([
      studentPage2.waitForURL(/\/student\/.+/),
      studentPage2.locator('button:has-text("Vào lớp")').click()
    ]);
    await expect(studentPage2.locator('text=/Xin chào/i')).toBeVisible();

    // 3. Move to Slide 6 (Trắc nghiệm MCQ)
    for (let i = 0; i < 5; i++) {
      await teacherPage.locator('button.right-4').click();
      await teacherPage.waitForTimeout(400);
    }
    await expect(teacherPage.locator('text="Trắc nghiệm"')).toBeVisible();
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();

    // Student 1 answers Option A (Correct)
    await expect(studentPage1.locator('button', { hasText: 'Option A' })).toBeVisible();
    await studentPage1.locator('button', { hasText: 'Option A' }).click();
    await studentPage1.locator('button', { hasText: 'Gửi đáp án' }).click();
    await expect(studentPage1.locator('button', { hasText: 'Đã gửi đáp án' })).toBeVisible();

    // Student 2 answers Option B (Incorrect)
    await expect(studentPage2.locator('button', { hasText: 'Option B' })).toBeVisible();
    await studentPage2.locator('button', { hasText: 'Option B' }).click();
    await studentPage2.locator('button', { hasText: 'Gửi đáp án' }).click();
    await expect(studentPage2.locator('button', { hasText: 'Đã gửi đáp án' })).toBeVisible();

    // 4. Test I: Duplicate submit protection
    // Button is disabled, student cannot click submit again
    await expect(studentPage1.locator('button', { hasText: 'Đã gửi đáp án' })).toBeDisabled();

    // 5. Test J: Student 1 goes OFFLINE before teacher approves
    await studentContext1.close();
    await teacherPage.waitForTimeout(1000);

    // 6. Teacher opens modal and approves correct answers (Test H: Duyệt đúng vs duyệt sai)
    await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
    await teacherPage.locator('button', { hasText: 'Duyệt điểm' }).first().hover();
    await teacherPage.locator('button', { hasText: 'Duyệt đáp án đúng' }).first().click();
    await expect(teacherPage.locator('button:has-text("Đã duyệt điểm")').first()).toBeVisible();

    // 7. Test H & I: Duyệt lại -> Không bị cộng trùng điểm (Idempotency)
    // Click approve again
    await teacherPage.locator('button:has-text("Đã duyệt điểm")').first().hover();
    const approveBtnAgain = teacherPage.locator('button', { hasText: 'Duyệt đáp án đúng' }).first();
    if (await approveBtnAgain.isVisible()) {
      await approveBtnAgain.click();
    }
    await teacherPage.locator('button:has-text("Đóng")').click();

    // 8. End Session & SAVE (Test P)
    await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
    const postResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/history') && res.status() === 200);
    await teacherPage.locator('button:has-text("LƯU VÀ KẾT THÚC")').click();
    await postResPromise;

    // 9. Verify saved history snapshot (Test J, K, L)
    const dbPath = path.join(process.cwd(), 'src', 'data', 'db.test.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const saved = db.sessionHistories.find((h: any) => h.sessionCode === sessionCode);
    expect(saved).toBeDefined();
    expect(saved.status).toBe('COMPLETED');

    // Offline student 1 was correctly awarded
    const hs1 = saved.students.find((s: any) => String(s.studentId) === '4869456649');
    const hs2 = saved.students.find((s: any) => String(s.studentId) === '4824891635');
    expect(hs1).toBeDefined();
    expect(hs1.sessionScore).toBe(1); // 1 point for Option A correct
    expect(hs1.activityResults[0].isCorrect).toBe(true);
    expect(hs1.activityResults[0].score).toBe(1);

    // Student 2 answered incorrect -> 0 points
    expect(hs2).toBeDefined();
    expect(hs2.sessionScore).toBe(0);
    expect(hs2.activityResults[0].isCorrect).toBe(false);
    expect(hs2.activityResults[0].score).toBe(0);

    // 10. Verify Cumulative API
    let cumRes = await request.get(`/api/cumulative-score?classId=CLS001`);
    let cumBody = await cumRes.json();
    let cumHs1 = cumBody.results.find((r: any) => String(r.studentId) === '4869456649');
    let cumHs2 = cumBody.results.find((r: any) => String(r.studentId) === '4824891635');
    expect(cumHs1.cumulativeScore).toBe(1);
    expect(cumHs2.cumulativeScore).toBe(0);

    // 11. Test Q: Discard Session
    // Start another session and Discard
    const teacherPage2 = await teacherContext.newPage();
    await teacherPage2.goto('/teacher/presentations/test-pres-1');
    await teacherPage2.locator('select').first().selectOption('CLS001');
    await teacherPage2.locator('button:has-text("Tạo phiên học")').click();
    await expect(teacherPage2.locator('span:has-text("Mã vào lớp:")')).toBeVisible();

    await teacherPage2.locator('button:has-text("Kết thúc phiên")').click();
    await teacherPage2.locator('button:has-text("BỎ DỮ LIỆU")').click();

    // Verify Cumulative Score remains 1 (Discarded session was NOT added)
    cumRes = await request.get(`/api/cumulative-score?classId=CLS001`);
    cumBody = await cumRes.json();
    cumHs1 = cumBody.results.find((r: any) => String(r.studentId) === '4869456649');
    expect(cumHs1.cumulativeScore).toBe(1);

    // 12. Test T: Backend authoritative score against rogue client trying to POST sessionScore = 999999
    const fakeHistoryPayload = {
      sessionCode: 'FAKE_SCORE_CODE',
      classId: 'CLS001',
      className: 'Lớp 6/1',
      topicIds: [],
      lessonIds: [],
      startedAt: Date.now() - 3600000,
      completedAt: Date.now(),
      status: 'COMPLETED',
      activities: [
        { activityId: 'act_test', slideNumber: 1, activityType: 'MULTIPLE_CHOICE', activityMode: 'INDIVIDUAL', maxScore: 1 }
      ],
      students: [
        {
          studentId: '4869456649',
          studentName: 'Nguyễn Văn A',
          sessionScore: 999999, // Rogue injected score
          activityResults: [
            { activityId: 'act_test', activityType: 'MULTIPLE_CHOICE', activityMode: 'INDIVIDUAL', answer: ['opt1'], score: 1, maxScore: 1 }
          ]
        }
      ]
    };

    const postFake = await request.post('/api/history', { data: fakeHistoryPayload });
    expect(postFake.status()).toBe(200);

    // Check DB: backend must recalculate sessionScore from activityResults, neutralizing 999999
    const dbAfterFake = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const savedFake = dbAfterFake.sessionHistories.find((h: any) => h.sessionCode === 'FAKE_SCORE_CODE');
    expect(savedFake).toBeDefined();
    expect(savedFake.students[0].sessionScore).toBe(1); // Neutralized to actual sum 1!
    expect(savedFake.students[0].sessionScore).not.toBe(999999);

    await teacherContext.close().catch(() => {});
    await studentContext2.close().catch(() => {});
  });
});
