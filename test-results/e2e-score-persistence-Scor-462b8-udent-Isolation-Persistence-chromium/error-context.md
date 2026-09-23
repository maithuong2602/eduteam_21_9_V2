# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\score-persistence.spec.ts >> Score Persistence & Session Integrity (S2-B) >> Multi-Activity, Exact Score, and Student Isolation Persistence
- Location: tests\e2e\score-persistence.spec.ts:16:7

# Error details

```
Test timeout of 30000ms exceeded.
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
                  - button "Đã khóa" [ref=e92]
                  - button "0s" [ref=e96]
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