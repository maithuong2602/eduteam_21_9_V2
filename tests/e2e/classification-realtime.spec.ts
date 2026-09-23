import { test, expect } from '@playwright/test';

test.describe('Classification Realtime Sync', () => {
  test('Teacher and Student realtime flow for Classification', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    // 1. Teacher creates session & opens Classification
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await expect(teacherPage.locator('[data-testid="teacher-page"]')).toBeVisible();
    
    // Chon Slide 3
    await teacherPage.locator('div.aspect-video').nth(2).click(); 

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
    
    // 3. Teacher starts activity
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    
    // 4. Student receives activity WITHOUT RELOAD
    await expect(studentPage.locator('text="Kéo thả các mục vào đúng nhóm"')).toBeVisible();
    await expect(studentPage.locator('text="Mục 1"')).toBeVisible();
    
    // 5. Student uses Click Fallback (Tap to Move)
    // Select Mục 1
    await studentPage.locator('text="Mục 1"').click();
    // Drop into Nhóm Đúng
    await studentPage.locator('.bg-gray-100:has-text("Nhóm Đúng")').click();

    // Select Mục 2
    await studentPage.locator('text="Mục 2"').click();
    // Drop into Nhóm Sai
    await studentPage.locator('.bg-gray-100:has-text("Nhóm Sai")').click();

    // Verify UI reflects "Đã phân loại hết"
    await expect(studentPage.locator('text="Đã phân loại hết"')).toBeVisible();

    // 6. Submit
    await studentPage.locator('[data-testid="submit-answer"]').click();
    await expect(studentPage.locator('[data-testid="submit-answer"]', { hasText: /Đã Nộp/i })).toBeVisible();
    
    // 7. Teacher receives answer realtime
    await expect(teacherPage.locator('text="1 phản hồi"')).toBeVisible();
    
    // 8. Cleanup
    await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
    await teacherPage.locator('button:has-text("BỎ DỮ LIỆU")').click();
    await teacherPage.waitForTimeout(500);
  });
});
