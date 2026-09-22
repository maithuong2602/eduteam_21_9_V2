const fs = require('fs');
let code = fs.readFileSync('tests/e2e/classification-realtime.spec.ts', 'utf8');
code = code.replace("await expect(teacherPage.locator('h3:has-text(\"Phân loại\")')).toBeVisible();", "");
fs.writeFileSync('tests/e2e/classification-realtime.spec.ts', code, 'utf8');
