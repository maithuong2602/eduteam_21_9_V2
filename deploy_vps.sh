#!/bin/bash
# ==========================================================
# Script triển khai an toàn Eduteam trên Ubuntu VPS (PM2 + Nginx)
# CHỈ CHẠY TIẾN TRÌNH 'eduteam' - TUYỆT ĐỐI KHÔNG ẢNH HƯỞNG CÁC SERVICE KHÁC
# ==========================================================
set -e

echo ">>> [1/5] Kiểm tra và khởi tạo cấu trúc thư mục persistence ngoài source..."
if [ ! -d "/var/lib/eduteam" ]; then
    echo "LƯU Ý: Nếu chưa tạo /var/lib/eduteam, hãy chạy lệnh sau với quyền sudo:"
    echo "  sudo mkdir -p /var/lib/eduteam/data /var/lib/eduteam/uploads /var/lib/eduteam/backups /var/lib/eduteam/secrets"
    echo "  sudo chown -R ubuntu:ubuntu /var/lib/eduteam"
fi

echo ">>> [2/5] Cài đặt dependencies..."
npm install

echo ">>> [3/5] Build ứng dụng Next.js production..."
npm run build

echo ">>> [4/5] Khởi động hoặc Reload PM2 (chỉ riêng app 'eduteam')..."
if pm2 list | grep -q "eduteam"; then
    pm2 restart eduteam
else
    pm2 start ecosystem.config.js --only eduteam
fi
pm2 save

echo ">>> [5/5] Hoàn tất! Eduteam đang hoạt động an toàn tại 127.0.0.1:3000."
pm2 status eduteam
