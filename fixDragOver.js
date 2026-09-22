const fs = require('fs');
let code = fs.readFileSync('tests/e2e/classification-realtime.spec.ts', 'utf8');

code = code.replace("await page.dispatchEvent(targetSelector, 'drop', { dataTransfer });", "await page.dispatchEvent(targetSelector, 'dragover', { dataTransfer });\n      await page.dispatchEvent(targetSelector, 'drop', { dataTransfer });");
fs.writeFileSync('tests/e2e/classification-realtime.spec.ts', code, 'utf8');
