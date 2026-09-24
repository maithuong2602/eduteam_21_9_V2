import { test, expect } from '@playwright/test';

test.describe('Lock / Unlock Realtime Sync', () => {
  test.beforeEach(async ({ request }) => {
    await request.get('/api/test/reset');
  });

  test('Teacher locks and unlocks activity', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    // 1. Teacher creates session & opens slide
    const presResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/presentations/test-pres-1') && res.status() === 200);
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await presResPromise;
    await expect(teacherPage.locator('[data-testid="teacher-page"]')).toBeVisible();
    
    // Choose Slide 6 (Lock Test)
    await teacherPage.locator('text="Slide 6"').click();
    await expect(teacherPage.locator('text="Tương tác (Slide 6)"')).toBeVisible();

    const classResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/classes/') && res.status() === 200);
    await teacherPage.locator('select').first().selectOption('CLS001');
    await classResPromise;
    
    await teacherPage.waitForTimeout(1000);
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
    
    // Teacher receives student online realtime
    await expect(teacherPage.locator('text="1 học sinh online"')).toBeVisible();
    
    // 3. Teacher starts activity
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    
    // 4. Student receives activity
    await expect(studentPage.locator('button', { hasText: 'Option A' })).toBeVisible();
    const submitBtn = studentPage.locator('button', { hasText: 'Gửi đáp án' });
    await expect(submitBtn).toBeVisible();
    
    // 5. Test Lock
    await teacherPage.locator('button:has-text("Khóa trả lời")').click();
    await expect(teacherPage.locator('button:has-text("Đã khóa")')).toBeVisible();
    
    // Student receives Lock state
    const lockedBtn = studentPage.locator('button', { hasText: 'Đã khóa trả lời' });
    await expect(lockedBtn).toBeVisible();
    await expect(lockedBtn).toBeDisabled();
    
    // Options should be disabled (checking pointer-events or opacity or simply disabled)
    const optionA = studentPage.locator('button', { hasText: 'Option A' });
    await expect(optionA).toBeDisabled();

    // 6. Test Unlock
    await teacherPage.locator('button:has-text("Đã khóa")').click();
    await expect(teacherPage.locator('button:has-text("Khóa trả lời")')).toBeVisible();
    
    // Student receives Unlock state
    await expect(studentPage.locator('button', { hasText: 'Gửi đáp án' })).toBeVisible();
    await expect(optionA).toBeEnabled();
    
    // 7. Student can submit after unlock
    await optionA.click();
    await expect(studentPage.locator('button', { hasText: 'Gửi đáp án' })).toBeEnabled();
    await studentPage.locator('button', { hasText: 'Gửi đáp án' }).click();
    
    // Student should see "Đã gửi đáp án"
    await expect(studentPage.locator('button', { hasText: 'Đã gửi đáp án' })).toBeVisible();
    
    // Teacher receives response
    await expect(teacherPage.locator('text="1 phản hồi"')).toBeVisible();
    
    // 8. Cleanup: End session to prevent state leakage to other tests
    await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
    await teacherPage.locator('button:has-text("BỎ DỮ LIỆU")').click();
    await teacherPage.waitForTimeout(500);
  });
});
