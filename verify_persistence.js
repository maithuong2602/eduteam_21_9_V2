const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');

console.log('--- BẮT ĐẦU TEST SỰ SỐNG CỦA SESSION SAU KHI LƯU ---');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Đã kết nối Socket:', socket.id);
    
    // 1. Tạo session
    socket.emit('create_session', { 
       classId: 'TEST_CLASS', 
       presentationId: 'TEST_PRES', 
       title: 'TEST' 
    });
});

socket.on('session_created', (data) => {
    console.log('Session đã được sinh ra trên RAM với mã:', data.code);
    
    // 2. Chờ 3.5 giây để trigger auto-save
    console.log('Đang chờ 3.5s để server tự động đồng bộ RAM xuống Disk...');
    setTimeout(() => {
        try {
           const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
           if (db.activeSessions && db.activeSessions[data.code]) {
               console.log('✅ TEST PASS: Session đã được cứu sống xuống ổ cứng db.json thành công!');
               console.log('Chi tiết:', JSON.stringify(db.activeSessions[data.code]).substring(0, 50) + '...');
           } else {
               console.log('❌ TEST FAIL: Không tìm thấy Session trong db.json!');
               process.exit(1);
           }
        } catch(e) {
           console.log('❌ TEST FAIL: Lỗi đọc db.json', e.message);
           process.exit(1);
        }
        process.exit(0);
    }, 3500);
});

setTimeout(() => {
    console.log('❌ TEST FAIL: Timeout');
    process.exit(1);
}, 6000);
