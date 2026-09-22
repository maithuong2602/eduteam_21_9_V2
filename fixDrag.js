const fs = require('fs');
let code = fs.readFileSync('tests/e2e/classification-realtime.spec.ts', 'utf8');

const dragCode = `
    // HTML5 Drag and Drop workaround in Playwright for React
    const dragDrop = async (sourceText, targetText, itemId) => {
        const source = studentPage.locator('text="' + sourceText + '"');
        const target = studentPage.locator('text="' + targetText + '"').locator('..'); // Get parent div with onDrop

        await source.dispatchEvent('dragstart', { dataTransfer: { getData: () => itemId, setData: () => {} } });
        await target.dispatchEvent('drop', { dataTransfer: { getData: (key) => key === 'itemId' ? itemId : '' } });
    };

    await dragDrop("Mục 1", "Nhóm Đúng", "I1");
    await dragDrop("Mục 2", "Nhóm Sai", "I2");
`;

code = code.replace("await studentPage.locator('text=\"Mục 1\"').dragTo(studentPage.locator('text=\"Nhóm Đúng\"'));", dragCode);
code = code.replace("await studentPage.locator('text=\"Mục 2\"').dragTo(studentPage.locator('text=\"Nhóm Sai\"'));", "");

fs.writeFileSync('tests/e2e/classification-realtime.spec.ts', code, 'utf8');
