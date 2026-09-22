import { test, expect } from '@playwright/test';

test.describe('Short Answer Realtime Sync', () => {
  test('Teacher and Student realtime flow for Short Answer', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    // 1. Teacher creates session & opens slide
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await expect(teacherPage.locator('[data-testid="teacher-page"]')).toBeVisible();
    
    // Choose Slide 4
    await teacherPage.locator('div.aspect-video').nth(3).click(); 

    const classResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/classes/') && res.status() === 200);
    await teacherPage.locator('select').first().selectOption('CLS001');
    await classResPromise;
    
    await teacherPage.locator('button:has-text("Tạo phiên học")').click();
    
    const codeLocator = teacherPage.locator('span:has-text("Mã vào lớp:")');
    await expect(codeLocator).toBeVisible();
    const fullText = await codeLocator.innerText();
    const sessionCode = fullText.replace('Mã vào lớp:', '').trim();
    
    // 2. Student joins
    await studentPage.goto('/join');
    await studentPage.locator('input').nth(0).fill(sessionCode);
    await studentPage.locator('input').nth(1).fill('HS001');
    await studentPage.locator('button:has-text("Vào lớp")').click();
    
    // 3. Teacher starts activity
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    
    // 4. Student receives activity WITHOUT RELOAD
    // Wait for the textarea to be visible
    const answerInput = studentPage.locator('textarea');
    await expect(answerInput).toBeVisible();
    await expect(studentPage.locator('h3', { hasText: /Nhập câu trả lời/i })).toBeVisible();
    
    // 5. Student fills answer
    const testAnswer = 'EduTeam Test 3D';
    await answerInput.fill(testAnswer);
    await expect(answerInput).toHaveValue(testAnswer);
    
    // 6. Submit
    await studentPage.locator('button', { hasText: /Gửi/i }).click();
    
    // Verify "Đã Gửi" state
    await expect(studentPage.locator('button', { hasText: /Đã Gửi/i })).toBeVisible();
    
    // 7. Teacher receives answer realtime
    await expect(teacherPage.locator('text="1 phản hồi"')).toBeVisible();
    
    // Check Teacher detailed UI renders the exact answer
    await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
    
    // The modal should contain the exact text "EduTeam Test 3D"
    await expect(teacherPage.locator(`text="${testAnswer}"`)).toBeVisible();
  });
});
