const fs = require('fs');
let code = fs.readFileSync('tests/e2e/realtime-sync.spec.ts', 'utf8');
code = code.replace("await teacherPage.locator('text=\"Slide 1\"').click();", "await teacherPage.locator('div.aspect-video').nth(0).click();");
fs.writeFileSync('tests/e2e/realtime-sync.spec.ts', code, 'utf8');
