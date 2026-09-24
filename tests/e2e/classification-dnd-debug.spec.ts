import { test, expect } from '@playwright/test';

test.describe('Classification DnD Debug', () => {
  test.beforeEach(async ({ request }) => {
    await request.get('/api/test/reset');
  });

  test.fixme('Playwright interaction debug (Fails due to React synthetic event limitations with Playwright DnD)', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    // 1. Teacher creates session & opens Classification
    await teacherPage.goto('/teacher/presentations/test-pres-1');
    await teacherPage.locator('div.aspect-video').nth(2).click(); 

    const classResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/classes/') && res.status() === 200);
    await teacherPage.locator('select').first().selectOption('CLS001');
    await classResPromise;
    
    await teacherPage.locator('button:has-text("Tạo phiên học")').click();
    
    const codeLocator = teacherPage.locator('span:has-text("Mã vào lớp:")');
    await expect(codeLocator).toBeVisible();
    const sessionCode = (await codeLocator.innerText()).replace('Mã vào lớp:', '').trim();
    
    // 2. Student joins
    await studentPage.goto('/join');
    await studentPage.locator('input').nth(0).fill(sessionCode);
    await studentPage.locator('input').nth(1).fill('HS001');
    await studentPage.locator('button:has-text("Vào lớp")').click();
    
    // 3. Teacher starts activity
    await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
    
    // 4. Student receives activity
    await expect(studentPage.locator('text="Kéo thả các mục vào đúng nhóm"')).toBeVisible();
    const item1 = studentPage.locator('text="Mục 1"');
    const groupTarget = studentPage.locator('.bg-gray-100:has-text("Nhóm Đúng")');
    await expect(item1).toBeVisible();
    await expect(groupTarget).toBeVisible();

    // METHOD A: dragTo native
    console.log("Trying native dragTo...");
    await item1.dragTo(groupTarget);
    
    // Check if it moved: The uncategorized pool will NOT contain Mục 1 anymore
    // If it fails, we will try manual mouse movements
    
    let isCategorized = false;
    try {
        await expect(studentPage.locator('text="Đã phân loại hết"')).toBeVisible({ timeout: 2000 });
        isCategorized = true;
    } catch(e) {
        // Failed
    }
    
    if (!isCategorized) {
        console.log("Native dragTo failed. Trying manual mouse...");
        const srcBox = await item1.boundingBox();
        const dstBox = await groupTarget.boundingBox();
        
        await studentPage.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
        await studentPage.mouse.down();
        await studentPage.mouse.move(dstBox.x + dstBox.width / 2, dstBox.y + dstBox.height / 2, { steps: 5 });
        await studentPage.mouse.up();
        
        try {
            await expect(studentPage.locator('text="Đã phân loại hết"')).toBeVisible({ timeout: 2000 });
            isCategorized = true;
        } catch(e) {
            // Failed
        }
    }
    
    if (!isCategorized) {
        console.log("Manual mouse failed. Trying custom HTML5 dispatchEvent...");
        
        await studentPage.evaluate(async () => {
            const source = Array.from(document.querySelectorAll('div')).find(el => el.textContent === 'Mục 1');
            const target = Array.from(document.querySelectorAll('.bg-gray-100')).find(el => el.textContent && el.textContent.includes('Nhóm Đúng'));
            
            const dt = new DataTransfer();
            dt.setData('itemId', 'I1');
            
            source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
            target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
            target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
        });
        
        try {
            await expect(studentPage.locator('text="Đã phân loại hết"')).toBeVisible({ timeout: 2000 });
            isCategorized = true;
        } catch(e) {}
    }
    
    expect(isCategorized).toBe(true);
  });
});
