const fs = require('fs');
let code = fs.readFileSync('tests/e2e/classification-realtime.spec.ts', 'utf8');

code = code.replace(/await studentPage.locator\('button', \{ hasText: \/Gửi\/i \}\)\.click\(\);/g, "await studentPage.locator('[data-testid=\"submit-answer\"]').click();");
code = code.replace(/await expect\(studentPage.locator\('button', \{ hasText: \/Đã Gửi\/i \}\)\)\.toBeVisible\(\);/g, "await expect(studentPage.locator('[data-testid=\"submit-answer\"]', { hasText: /Đã Nộp/i })).toBeVisible();");

fs.writeFileSync('tests/e2e/classification-realtime.spec.ts', code, 'utf8');
