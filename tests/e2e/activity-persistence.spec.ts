import { test, expect } from '@playwright/test';

test.describe('Activity Persistence', () => {
  test('Classification activity saves and restores correctly', async ({ page }) => {
    // 1. Mở presentation (id đã được tạo trong global-setup)
    await page.goto('/teacher/presentations/test-pres-1');
    await expect(page.locator('[data-testid="teacher-page"]')).toBeVisible();
    
    // 2. Chọn Slide 1
    await page.locator('text="Slide 1"').click();
    
    // 3. Tạo Activity Phân loại
    const createBtn = page.locator('button:has-text("Phân loại")');
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    
    // 4. Mở bộ thiết lập
    const openBuilderBtn = page.locator('button:has-text("Mở bộ thiết lập")');
    await expect(openBuilderBtn).toBeVisible();
    await openBuilderBtn.click();
    
    // 5. Thay đổi tên 2 nhóm mặc định
    const groupInputs = page.locator('input.font-bold');
    await expect(groupInputs).toHaveCount(2);
    await groupInputs.nth(0).fill('Nhóm Test 1');
    await groupInputs.nth(1).fill('Nhóm Test 2');
    
    // Điền 3 mục ban đầu
    const itemTextareas = page.locator('.group\\/item textarea');
    await expect(itemTextareas).toHaveCount(3);
    await itemTextareas.nth(0).fill('Bàn phím');
    await itemTextareas.nth(1).fill('Chuột');
    await itemTextareas.nth(2).fill('Màn hình');
    
    // Thêm 1 mục mới vào Nhóm 1 (Nhóm 1 hiện có 2 mục)
    // Nút Thêm mục thứ 0 tương ứng Nhóm 1
    const addButtons = page.locator('button:has-text("Thêm mục")');
    await addButtons.nth(0).click(); 
    
    // Chờ có 4 textarea
    await expect(page.locator('.group\\/item textarea')).toHaveCount(4);
    // Điền mục mới (Mục mới sẽ nằm ở cuối Nhóm 1, tức là nth(2), Màn hình bị đẩy xuống nth(3))
    await page.locator('.group\\/item textarea').nth(2).fill('Webcam');
    
    // Removed savePromise
    
    // 6. Click Lưu thay đổi
    await page.locator('button:has-text("Lưu thay đổi")').click();
    
    await page.waitForTimeout(2000);
    
    // 8. Reload trang
    await page.reload();
    await expect(page.locator('[data-testid="teacher-page"]')).toBeVisible();
    
    // 9. Mở lại Slide 1
    await page.locator('text="Slide 1"').click();
    
    // 10. Kiểm tra cấu hình có được lưu không
    await expect(page.locator('button:has-text("Mở bộ thiết lập")')).toBeVisible();
    await page.locator('button:has-text("Mở bộ thiết lập")').click();
    
    // Kiểm tra dữ liệu
    const loadedGroupInputs = page.locator('input.font-bold');
    await expect(loadedGroupInputs).toHaveCount(2);
    await expect(loadedGroupInputs.nth(0)).toHaveValue('Nhóm Test 1');
    await expect(loadedGroupInputs.nth(1)).toHaveValue('Nhóm Test 2');
    
    const loadedTextareas = page.locator('.group\\/item textarea');
    await expect(loadedTextareas).toHaveCount(4);
    
    // Đảm bảo 4 item có đúng tên (bất kể thứ tự do DOM render nhóm)
    for (const text of ['Bàn phím', 'Chuột', 'Webcam', 'Màn hình']) {
       const hasText = await page.evaluate((val) => {
         return Array.from(document.querySelectorAll('.group\\/item textarea')).some((ta: any) => ta.value === val);
       }, text);
       expect(hasText).toBeTruthy();
    }
  });
});
