const fs = require('fs');
let code = fs.readFileSync('tests/e2e/classification-realtime.spec.ts', 'utf8');

const dragCode = `
    // 5. Student performs classification via Drag and Drop
    await studentPage.locator('text="Mục 1"').dragTo(studentPage.locator('.bg-gray-100:has-text("Nhóm Đúng")'));
    await studentPage.locator('text="Mục 2"').dragTo(studentPage.locator('.bg-gray-100:has-text("Nhóm Sai")'));
`;

code = code.replace(/    \/\/ Execute drag and drop inside browser.*await dragDrop\("Mục 2", "Nhóm Sai", "I2"\);/s, dragCode);
fs.writeFileSync('tests/e2e/classification-realtime.spec.ts', code, 'utf8');
