import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Group Persistence Automation Tests', () => {
  test('Group Persistence flows', async ({ browser, request }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    // 1. Teacher sets up session
    await teacherPage.goto('/teacher/classes');
    await teacherPage.locator('text=CLS001').click();
    
    // Test 1: Change chưa sync -> Reload -> Trạng thái cũ
    await teacherPage.locator('button', { hasText: 'Phân nhóm' }).first().click();
    await teacherPage.locator('select').selectOption({ label: 'Tạo nhóm mới' });
    await teacherPage.locator('input[placeholder="Nhập tên nhóm mới"]').fill('Nhóm Test 1');
    await teacherPage.locator('button', { hasText: 'Xác nhận' }).click();

    // Now hasUnsavedChanges is true, UI has it but it's not saved.
    const saveButton = teacherPage.locator('button', { hasText: 'Lưu đồng bộ *' });
    await expect(saveButton).toBeVisible();

    // Reload browser
    await teacherPage.reload();
    
    // The asterisk should not be there anymore, group state reverted
    const normalSaveButton = teacherPage.locator('button', { hasText: 'Lưu đồng bộ', exact: true });
    await expect(normalSaveButton).toBeVisible();
    
    // Test B: Change + Sync -> DB đổi
    await teacherPage.locator('button', { hasText: 'Phân nhóm' }).first().click();
    await teacherPage.locator('select').selectOption({ label: 'Tạo nhóm mới' });
    await teacherPage.locator('input[placeholder="Nhập tên nhóm mới"]').fill('Nhóm Test 1');
    await teacherPage.locator('button', { hasText: 'Xác nhận' }).click();

    await teacherPage.locator('button', { hasText: 'Lưu đồng bộ *' }).click();
    
    // Wait for alert
    teacherPage.once('dialog', dialog => dialog.accept());
    // Give it a moment to finish API calls
    await teacherPage.waitForTimeout(500);

    // Call API directly to check DB persistence
    const res = await request.get('/api/groups');
    const body = await res.json();
    const testGroup = body.groups.find((g: any) => g.name === 'Nhóm Test 1');
    expect(testGroup).toBeDefined();

    // Test C: Remove + Sync -> Ungrouped
    await teacherPage.locator('button', { hasText: 'Xóa khỏi nhóm' }).first().click();
    await teacherPage.locator('button', { hasText: 'Lưu đồng bộ *' }).click();
    teacherPage.once('dialog', dialog => dialog.accept());
    await teacherPage.waitForTimeout(500);
    
    const res2 = await request.get('/api/groups');
    const body2 = await res2.json();
    const testGroup2 = body2.groups.find((g: any) => g.name === 'Nhóm Test 1');
    expect(testGroup2.members.length).toBe(0);

    await teacherContext.close();
  });
});
