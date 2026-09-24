import { test, expect } from '@playwright/test';

test.describe('Realtime Sync', () => {
  test.beforeEach(async ({ request }) => {
    await request.get('/api/test/reset');
  });

  test('Teacher and Student realtime flow', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    // 1. Teacher creates session
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await expect(teacherPage.locator('[data-testid="teacher-page"]')).toBeVisible();
    
    // BẮT BUỘC CHỌN SLIDE TRƯỚC KHI TẠO PHIÊN
    await teacherPage.locator('div.aspect-video').nth(1).click(); // Click Slide 2
    
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
    
    // Teacher sees 1 học sinh online
    await expect(teacherPage.locator('text="1 học sinh online"')).toBeVisible();
    
    // 3. Teacher starts activity (MULTIPLE_CHOICE)
    await teacherPage.locator('button:has-text("Trắc nghiệm")').click();
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    
    // 4. Student receives activity WITHOUT RELOAD
    await expect(studentPage.locator('button:has-text("Đáp án A")')).toBeVisible();
    
    // 5. Student submits answer
    await studentPage.locator('button:has-text("Đáp án A")').click();
    await studentPage.locator('button', { hasText: /Gửi/i }).click();
    
    // Student sees "Đã Gửi"
    await expect(studentPage.locator('button', { hasText: /Đã Gửi/i })).toBeVisible();
    
    // 6. Teacher receives answer realtime
    await expect(teacherPage.locator('text="1 phản hồi"')).toBeVisible();
    
    // 7. Cleanup
    await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
    await teacherPage.locator('button:has-text("BỎ DỮ LIỆU")').click();
    await teacherPage.waitForTimeout(500);
  });
});
