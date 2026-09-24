import { test, expect } from '@playwright/test';

test.describe('Short Answer Realtime Sync', () => {
  test.beforeEach(async ({ request }) => {
    await request.get('/api/test/reset');
  });

  test('Teacher and Student realtime flow for Short Answer', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    // 1. Teacher creates session & opens slide
    const presResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/presentations/test-pres-1') && res.status() === 200);
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await presResPromise;
    await expect(teacherPage.locator('[data-testid="teacher-page"]')).toBeVisible();
    
    // Choose Slide 4 and wait for Short Answer activity configuration to be active
    await teacherPage.locator('text="Slide 4"').click();
    await expect(teacherPage.locator('text="Cấu hình cho câu hỏi Trả lời ngắn."')).toBeVisible();

    const classResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/classes/') && res.status() === 200);
    await teacherPage.locator('select').first().selectOption('CLS001');
    await classResPromise;
    
    await teacherPage.waitForTimeout(1000); // Wait for socket to fully connect
    await teacherPage.locator('button:has-text("Tạo phiên học")').click();
    
    const codeLocator = teacherPage.locator('span:has-text("Mã vào lớp:")');
    await expect(codeLocator).toBeVisible();
    const fullText = await codeLocator.innerText();
    const sessionCode = fullText.replace('Mã vào lớp:', '').trim();
    
    // 2. Student joins
    await studentPage.goto('/join');
    await studentPage.locator('input').nth(0).fill(sessionCode);
    await studentPage.locator('input').nth(1).fill('HS001');
    await Promise.all([
      studentPage.waitForURL(/\/student\/.+/),
      studentPage.locator('button:has-text("Vào lớp")').click()
    ]);
    
    // Teacher receives student online realtime without reload
    await expect(teacherPage.locator('text=/1 học sinh online/i')).toBeVisible({ timeout: 15000 });
    
    // 3. Teacher starts activity
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    
    // 4. Student receives activity WITHOUT RELOAD
    const questionHeading = studentPage.locator('h3', { hasText: /Nhập câu trả lời/i });
    await expect(questionHeading).toBeVisible();
    
    const answerInput = studentPage.locator('textarea');
    await expect(answerInput).toBeVisible();
    
    const submitBtn = studentPage.locator('button', { hasText: /Gửi/i });
    await expect(submitBtn).toBeVisible();
    
    // Check validation: empty answer cannot be submitted (button disabled)
    await expect(submitBtn).toBeDisabled();
    
    // 5. Student fills answer
    const testAnswer = 'EduTeam Test 3D';
    await answerInput.fill(testAnswer);
    await expect(answerInput).toHaveValue(testAnswer);
    await expect(submitBtn).toBeEnabled();
    
    // 6. Submit
    await submitBtn.click();
    
    // Verify "Đã Gửi" state and input disabled
    await expect(studentPage.locator('button', { hasText: /Đã Gửi/i })).toBeVisible();
    await expect(answerInput).toBeDisabled();
    
    // 7. Teacher receives answer realtime without reload
    await expect(teacherPage.locator('text="1 phản hồi"')).toBeVisible();
    
    // Check Teacher detailed UI renders the exact answer
    await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
    
    // The modal should contain the exact text "EduTeam Test 3D"
    await expect(teacherPage.locator(`text="${testAnswer}"`)).toBeVisible();
    await teacherPage.locator('button:has-text("Đóng")').click();
    
    // 8. Cleanup
    await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
    await teacherPage.locator('button:has-text("BỎ DỮ LIỆU")').click();
    await teacherPage.waitForTimeout(500);
  });
});
