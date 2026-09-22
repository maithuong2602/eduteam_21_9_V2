const fs = require('fs');
let code = fs.readFileSync('tests/e2e/classification-realtime.spec.ts', 'utf8');

const dragCode = `
    // Advanced Playwright HTML5 Drag and Drop helper
    const dragAndDrop = async (page, sourceSelector, targetSelector) => {
      const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
      await page.dispatchEvent(sourceSelector, 'dragstart', { dataTransfer });
      await page.dispatchEvent(targetSelector, 'drop', { dataTransfer });
    };

    await dragAndDrop(studentPage, 'text="Mục 1"', 'text="Nhóm Đúng"');
    await dragAndDrop(studentPage, 'text="Mục 2"', 'text="Nhóm Sai"');
`;

code = code.replace(/    \/\/ Mock the drop event directly in browser.*\}\);/s, dragCode);
fs.writeFileSync('tests/e2e/classification-realtime.spec.ts', code, 'utf8');
