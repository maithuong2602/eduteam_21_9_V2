# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\score-persistence.spec.ts >> Score Persistence & Session Integrity (S2-B) >> Multi-Activity, Exact Score, and Student Isolation Persistence
- Location: tests\e2e\score-persistence.spec.ts:16:7

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 2
Received:    1
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - link [ref=e7] [cursor=pointer]:
            - /url: /teacher/presentations
          - heading "E2E Test Presentation" [level=1] [ref=e10]
          - generic [ref=e11]: Đã lưu
          - generic [ref=e12]: "Mã vào lớp: DUP1MH"
        - generic [ref=e13]:
          - button "Quản lý nhóm" [ref=e14]
          - generic [ref=e20]:
            - generic [ref=e21]: 1 học sinh online
            - button "Kết thúc phiên" [ref=e27]
      - generic [ref=e28]:
        - generic [ref=e30]:
          - generic [ref=e31]: Đang tải slide...
          - button [ref=e33]
          - button [ref=e36]
          - generic: 3 / 7
        - generic [ref=e39]:
          - heading "Tương tác (Slide 3)" [level=2] [ref=e41]
          - generic [ref=e45]:
            - generic [ref=e46]:
              - generic [ref=e47]: "Các hoạt động:"
              - generic [ref=e48] [cursor=pointer]: Hoạt động
              - button "+ Thêm / Chọn hoạt động khác" [ref=e50]
            - generic [ref=e51]:
              - generic [ref=e52]:
                - generic [ref=e53]: Phân loại
                - button "Xóa hoạt động" [ref=e62]
              - generic [ref=e66]:
                - generic [ref=e67]:
                  - generic [ref=e68]: "Tên hoạt động (VD: B1HD1)"
                  - textbox "Nhập tên hoạt động..." [ref=e69]
                - generic [ref=e70]:
                  - generic [ref=e71]:
                    - generic [ref=e72]: Chế độ làm bài
                    - combobox [ref=e73]:
                      - option "Cá nhân" [selected]
                      - option "Theo nhóm"
                  - generic [ref=e74]:
                    - generic [ref=e75]: Điểm cộng
                    - spinbutton [ref=e76]: "1"
                - generic [ref=e77]:
                  - generic [ref=e78]:
                    - generic [ref=e79]: Loại Bonus
                    - combobox [ref=e80]:
                      - option "Không có" [selected]
                      - option "Cá nhân"
                      - option "Nhóm"
                  - generic [ref=e81]:
                    - generic [ref=e82]: Điểm Bonus
                    - spinbutton [ref=e83]: "0"
              - generic [ref=e85]:
                - heading "Trình tạo Phân loại" [level=4] [ref=e86]
                - paragraph [ref=e87]: Thiết kế các nhóm và mục kéo thả trực quan cho học sinh
                - button "Mở bộ thiết lập" [ref=e88]
              - generic [ref=e89]:
                - button "Lưu cấu hình" [ref=e90]
                - generic [ref=e91]:
                  - button "Khóa trả lời" [ref=e92]
                  - button "5s" [ref=e96]
                - button "Bắt đầu hoạt động" [ref=e100]
                - generic [ref=e103]:
                  - generic [ref=e104]:
                    - generic [ref=e105]: Kết quả Realtime
                    - generic [ref=e106]: 1 phản hồi
                  - button "Mở bảng Chi tiết Kết quả" [ref=e107]
                - generic [ref=e108]:
                  - generic [ref=e109]: Bảng xếp hạng (Top 5)
                  - generic [ref=e116]:
                    - generic [ref=e117]:
                      - generic [ref=e118]:
                        - generic [ref=e119]: "1"
                        - generic "Lê Trương Đức Minh" [ref=e120]
                      - generic [ref=e121]: "2"
                    - generic [ref=e122]:
                      - generic [ref=e123]:
                        - generic [ref=e124]: "2"
                        - generic "Phạm Hoàng Nam" [ref=e125]
                      - generic [ref=e126]: "0"
      - generic [ref=e128]:
        - generic [ref=e129]:
          - heading "Kết thúc phiên dạy" [level=3] [ref=e130]
          - button [ref=e131]
        - generic [ref=e135]:
          - button "LƯU VÀ KẾT THÚC Lưu dữ liệu vào lịch sử và đóng phiên dạy hiện tại" [ref=e136]:
            - text: LƯU VÀ KẾT THÚC
            - generic [ref=e137]: Lưu dữ liệu vào lịch sử và đóng phiên dạy hiện tại
          - button "TIẾP TỤC DẠY Quay lại màn hình trình chiếu" [ref=e138]:
            - text: TIẾP TỤC DẠY
            - generic [ref=e139]: Quay lại màn hình trình chiếu
          - button "BỎ DỮ LIỆU Kết thúc phiên và không lưu kết quả" [active] [ref=e140]:
            - text: BỎ DỮ LIỆU
            - generic [ref=e141]: Kết thúc phiên và không lưu kết quả
  - button "Open Next.js Dev Tools" [ref=e147] [cursor=pointer]
  - alert [ref=e151]
```

# Test source

```ts
  44  | 
  45  |     // 3. Student 2 joins
  46  |     await studentPage2.goto('/join');
  47  |     await studentPage2.locator('input').nth(0).fill(sessionCode);
  48  |     await studentPage2.locator('input').nth(1).fill('4824891635');
  49  |     await Promise.all([
  50  |       studentPage2.waitForURL(/\/student\/.+/),
  51  |       studentPage2.locator('button:has-text("Vào lớp")').click()
  52  |     ]);
  53  |     await expect(studentPage2.locator('text=/Xin chào/i')).toBeVisible();
  54  | 
  55  |     // -- ACTIVITY 1: MCQ (Slide 6) --
  56  |     // Go to slide 6 (from slide 1) => click Next 5 times
  57  |     for (let i = 0; i < 5; i++) {
  58  |       await teacherPage.locator('button.right-4').click();
  59  |       await teacherPage.waitForTimeout(500);
  60  |     }
  61  |     await expect(teacherPage.locator('text="Trắc nghiệm"')).toBeVisible();
  62  |     await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
  63  |     await teacherPage.waitForTimeout(500);
  64  |     
  65  |     const unlockBtn = teacherPage.locator('button:has-text("Mở khóa hoạt động")');
  66  |     if (await unlockBtn.isVisible()) {
  67  |       await unlockBtn.click();
  68  |       await teacherPage.waitForTimeout(500);
  69  |     }
  70  |     
  71  |     // HS1 answers Option A (Correct)
  72  |     await expect(studentPage1.locator('button', { hasText: 'Option A' })).toBeVisible();
  73  |     await studentPage1.locator('button', { hasText: 'Option A' }).click();
  74  |     await studentPage1.locator('button', { hasText: 'Gửi đáp án' }).click();
  75  |     
  76  |     // HS2 answers Option B (Incorrect)
  77  |     await expect(studentPage2.locator('button', { hasText: 'Option A' })).toBeVisible();
  78  |     await studentPage2.locator('button', { hasText: 'Option B' }).click();
  79  |     await studentPage2.locator('button', { hasText: 'Gửi đáp án' }).click();
  80  |     
  81  |     await teacherPage.waitForTimeout(1000); // Wait for answers to reach teacher
  82  |     await expect(teacherPage.locator('text="2 phản hồi"')).toBeVisible();
  83  |     
  84  |     await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
  85  |     await teacherPage.locator('button', { hasText: 'Duyệt điểm' }).first().hover();
  86  |     await teacherPage.locator('button', { hasText: 'Duyệt đáp án đúng' }).first().click();
  87  |     await expect(teacherPage.locator('button:has-text("Đã duyệt điểm")').first()).toBeVisible();
  88  |     
  89  |     // Close modal
  90  |     await teacherPage.locator('button:has-text("Đóng")').click();
  91  | 
  92  |     // -- ACTIVITY 2: Short Answer (Slide 4) --
  93  |     // We are at Slide 6, go back to Slide 4 => click Prev 2 times
  94  |     for (let i = 0; i < 2; i++) {
  95  |       await teacherPage.locator('button.left-4').click();
  96  |       await teacherPage.waitForTimeout(500);
  97  |     }
  98  |     
  99  |     await expect(teacherPage.locator('text="Trả lời ngắn"')).toBeVisible();
  100 |     await teacherPage.locator('button:has-text("Bắt đầu hoạt động")').click();
  101 | 
  102 |     await studentPage1.locator('textarea').fill('Test 1');
  103 |     await studentPage1.locator('button', { hasText: /Gửi Câu Trả Lời/i }).click();
  104 |     
  105 |     await teacherPage.waitForTimeout(1000); // Wait for answers to reach teacher
  106 |     await expect(teacherPage.locator('text="1 phản hồi"')).toBeVisible();
  107 |     
  108 |     await teacherPage.locator('button:has-text("Mở bảng Chi tiết Kết quả")').click();
  109 |     await teacherPage.locator('button', { hasText: 'Duyệt điểm' }).first().hover();
  110 |     await teacherPage.locator('button', { hasText: 'Duyệt tất cả (Cộng 100%)' }).first().click();
  111 |     await expect(teacherPage.locator('button:has-text("Đã duyệt điểm")').first()).toBeVisible();
  112 |     
  113 |     // Close modal
  114 |     await teacherPage.locator('button:has-text("Đóng")').click();
  115 |     
  116 |     // -- END SESSION & SAVE --
  117 |     await teacherPage.locator('button:has-text("Kết thúc phiên")').click();
  118 |     const postResPromise = teacherPage.waitForResponse(res => res.url().includes('/api/history') && res.status() === 200);
  119 |     await teacherPage.locator('button:has-text("LƯU VÀ KẾT THÚC")').click();
  120 |     await postResPromise;
  121 | 
  122 |     // -- API VERIFICATION --
  123 |     const fs = require('fs');
  124 |     const path = require('path');
  125 |     const dbPath = path.join(process.cwd(), 'src', 'data', 'db.test.json');
  126 |     const dbContent = fs.readFileSync(dbPath, 'utf8');
  127 |     const db = JSON.parse(dbContent);
  128 |     
  129 |     const savedHistory = db.sessionHistories.find((h: any) => h.sessionCode === sessionCode);
  130 |     expect(savedHistory).toBeDefined();
  131 | 
  132 |     // Student Isolation
  133 |     const hs1 = savedHistory.students.find((s: any) => String(s.studentId) === '4869456649');
  134 |     const hs2 = savedHistory.students.find((s: any) => String(s.studentId) === '4824891635');
  135 |     
  136 |     expect(hs1).toBeDefined();
  137 |     expect(hs2).toBeDefined();
  138 | 
  139 |     // Check Multi-Activity persistence
  140 |     if (hs1.activityResults.length < 2) {
  141 |       console.log("DEBUG_FAIL hs1.activityResults: ", JSON.stringify(hs1.activityResults));
  142 |       console.log("DEBUG_FAIL db sessionHistory count: ", db.sessionHistories.length);
  143 |     }
> 144 |     expect(hs1.activityResults.length).toBeGreaterThanOrEqual(2);
      |                                        ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  145 |     
  146 |     const shortAnswerResult = hs1.activityResults.find((a: any) => a.activityType === 'SHORT_ANSWER');
  147 |     expect(shortAnswerResult).toBeDefined();
  148 |     expect(shortAnswerResult.answer).toEqual(['Test 1']); // Raw answer preserved
  149 |     expect(shortAnswerResult.score).toBeGreaterThan(0); // Awarded because has response
  150 |     
  151 |     expect(hs1.sessionScore).toBeGreaterThan(0);
  152 |     expect(hs2.sessionScore).toBe(0); 
  153 |   });
  154 | });
  155 | 
```