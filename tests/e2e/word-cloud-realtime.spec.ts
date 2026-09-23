import { test, expect } from '@playwright/test';

test.describe('Word Cloud Realtime Sync', () => {
  test('Concurrent multi-student realtime flow for Word Cloud', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    const student1Context = await browser.newContext();
    const student1Page = await student1Context.newPage();

    const student2Context = await browser.newContext();
    const student2Page = await student2Context.newPage();

    const student3Context = await browser.newContext();
    const student3Page = await student3Context.newPage();

    // 1. Teacher creates session & opens slide
    const presResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/presentations/test-pres-1') && res.status() === 200);
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await presResPromise;
    await expect(teacherPage.locator('[data-testid="teacher-page"]')).toBeVisible();
    
    // Choose Slide 5 (Word Cloud)
    await teacherPage.locator('text="Slide 5"').click();
    await expect(teacherPage.locator('text="Tương tác (Slide 5)"')).toBeVisible();

    const classResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/classes/') && res.status() === 200);
    await teacherPage.locator('select').first().selectOption('CLS001');
    await classResPromise;
    
    await teacherPage.waitForTimeout(1000); // Wait for socket to fully connect
    await teacherPage.locator('button:has-text("Tạo phiên học")').click();
    
    const codeLocator = teacherPage.locator('span:has-text("Mã vào lớp:")');
    await expect(codeLocator).toBeVisible();
    const fullText = await codeLocator.innerText();
    const sessionCode = fullText.replace('Mã vào lớp:', '').trim();
    
    // 2. 3 Students join
    const joinStudent = async (page, studentId) => {
      await page.goto('/join');
      await page.locator('input').nth(0).fill(sessionCode);
      await page.locator('input').nth(1).fill(studentId);
      await Promise.all([
        page.waitForURL(/\/student\/.+/),
        page.locator('button:has-text("Vào lớp")').click()
      ]);
      await expect(page.locator('text=/Hãy đợi giáo viên/i')).toBeVisible({ timeout: 15000 });
    };

    await joinStudent(student1Page, 'HS001');
    await joinStudent(student2Page, 'HS002');
    await joinStudent(student3Page, 'HS003');
    
    // 3. Teacher starts activity
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    
    // 4. Students receive activity WITHOUT RELOAD
    const checkStudentActivity = async (page) => {
      const questionHeading = page.locator('h3', { hasText: /Nhập từ khóa/i });
      await expect(questionHeading).toBeVisible();
      
      const answerInput = page.locator('input[type="text"]');
      await expect(answerInput).toBeVisible();
      
      const submitBtn = page.locator('button', { hasText: /Gửi/i });
      await expect(submitBtn).toBeVisible();
      await expect(submitBtn).toBeDisabled(); // empty answer disabled
    };

    await Promise.all([
      checkStudentActivity(student1Page),
      checkStudentActivity(student2Page),
      checkStudentActivity(student3Page)
    ]);
    
    // 5. Students fill answer
    await student1Page.locator('input[type="text"]').fill('AI');
    await student2Page.locator('input[type="text"]').fill('AI');
    await student3Page.locator('input[type="text"]').fill('Dữ liệu');
    
    await expect(student1Page.locator('button', { hasText: /Gửi Từ Khóa/i })).toBeEnabled();
    await expect(student2Page.locator('button', { hasText: /Gửi Từ Khóa/i })).toBeEnabled();
    await expect(student3Page.locator('button', { hasText: /Gửi Từ Khóa/i })).toBeEnabled();

    // 6. Submit nearly concurrently
    await student1Page.locator('button', { hasText: /Gửi Từ Khóa/i }).click();
    await student2Page.locator('button', { hasText: /Gửi Từ Khóa/i }).click();
    await student3Page.locator('button', { hasText: /Gửi Từ Khóa/i }).click();
    
    // Verify "Đã Gửi" state
    await expect(student1Page.locator('button', { hasText: /Đã Gửi/i })).toBeVisible();
    await expect(student2Page.locator('button', { hasText: /Đã Gửi/i })).toBeVisible();
    await expect(student3Page.locator('button', { hasText: /Đã Gửi/i })).toBeVisible();
    
    // 7. Teacher receives 3 answers realtime without reload
    await expect(teacherPage.locator('text="3 phản hồi"')).toBeVisible();
    
    // Open results modal first because Word Cloud is rendered inside it
    await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
    
    // 8. Word Cloud renders normalized words inside the modal
    // "AI" -> "ai", "Dữ liệu" -> "dữ liệu"
    await expect(teacherPage.locator('span', { hasText: 'ai' }).first()).toBeVisible();
    await expect(teacherPage.locator('span', { hasText: 'dữ liệu' }).first()).toBeVisible();
    
    // Check detailed results
    await expect(teacherPage.locator('text="Danh sách chi tiết (3 phản hồi)"')).toBeVisible();
    
    // Both words should be in the details view
    const aiOccurrences = await teacherPage.locator('text="AI"').count();
    expect(aiOccurrences).toBeGreaterThanOrEqual(2); // In details it shows original text "AI"
    await expect(teacherPage.locator('text="Dữ liệu"')).toBeVisible();
  });
});
