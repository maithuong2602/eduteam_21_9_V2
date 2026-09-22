const fs = require('fs');
let code = fs.readFileSync('tests/e2e/classification-realtime.spec.ts', 'utf8');

code = code.replace("await page.evaluateHandle((dt, id) => { dt.setData('itemId', id); }, dataTransfer, itemId);", "await page.evaluateHandle(({ dt, id }) => { dt.setData('itemId', id); }, { dt: dataTransfer, id: itemId });");
fs.writeFileSync('tests/e2e/classification-realtime.spec.ts', code, 'utf8');
