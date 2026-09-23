import { test, expect } from '@playwright/test';

test.describe('Session Reconnect Realtime Sync', () => {
  // Increase timeout for this test as reconnect/disconnect might take a few seconds
  test.setTimeout(120000);

  test('Teacher and Student reconnect flow and state recovery', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    // 1. Teacher creates session & opens slide
    const presResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/presentations/test-pres-1') && res.status() === 200);
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await presResPromise;
    await expect(teacherPage.locator('[data-testid="teacher-page"]')).toBeVisible();
    
    // Choose Slide 7 (Reconnect Test)
    await teacherPage.locator('text="Slide 7"').click();
    await expect(teacherPage.locator('text="Tương tác (Slide 7)"')).toBeVisible();

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
    await expect(teacherPage.locator('text=/1 h.c sinh online/i')).toBeVisible();
    
    // 3. Teacher starts activity
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    
    // 4. Student receives activity and SUBMITS BEFORE DISCONNECT
    await expect(studentPage.locator('button', { hasText: 'Option A' })).toBeVisible();
    await studentPage.locator('button', { hasText: 'Option A' }).click();
    await studentPage.locator('button', { hasText: 'Gửi đáp án' }).click();
    await expect(studentPage.locator('button', { hasText: 'Đã gửi đáp án' })).toBeVisible();
    
    // Teacher receives 1 response
    await expect(teacherPage.locator('text="1 phản hồi"')).toBeVisible();
    
    // 5. Teacher Locks Activity
    await teacherPage.locator('button:has-text("Khóa trả lời")').click();
    await expect(teacherPage.locator('button:has-text("Đã khóa")')).toBeVisible();
    
    // 6. Disconnect Student using browser context offline
    await studentContext.setOffline(true);
    
    // Verify Teacher sees student go offline
    await expect(teacherPage.locator('text=/0 h.c sinh online/i')).toBeVisible({ timeout: 60000 });
    
    // Reconnect Student
    await studentContext.setOffline(false);
    
    // Assert 1 - ONLINE STATE
    await expect(teacherPage.locator('text=/1 h.c sinh online/i')).toBeVisible({ timeout: 60000 });
    
    // Assert 2 & 3 - ACTIVITY STATE & SUBMITTED STATE RECOVERY
    // After reconnect, student should recover the activity and it should be "Đã gửi đáp án" (since submitted overrides isLocked in UI)
    await expect(studentPage.locator('button', { hasText: 'Đã gửi đáp án' })).toBeVisible();
    
    // Verify Teacher still sees 1 response
    await expect(teacherPage.locator('text="1 phản hồi"')).toBeVisible();
    
    // 7. Verify Unlock does not allow resubmit
    await teacherPage.locator('button:has-text("Đã khóa")').click();
    
    // Student should STILL see "Đã gửi đáp án" and NOT "Gửi đáp án"
    await expect(studentPage.locator('button', { hasText: 'Đã gửi đáp án' })).toBeVisible();
    
    // Verify teacher STILL sees 1 response
    await expect(teacherPage.locator('text="1 phản hồi"')).toBeVisible();
  });
});
