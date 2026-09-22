const fs = require('fs');
let code = fs.readFileSync('tests/e2e/realtime-sync.spec.ts', 'utf8');
code = code.replace("await teacherPage.locator('div.aspect-video').nth(0).click();", "await teacherPage.locator('div.aspect-video').nth(1).click(); // Click Slide 2");
fs.writeFileSync('tests/e2e/realtime-sync.spec.ts', code, 'utf8');
