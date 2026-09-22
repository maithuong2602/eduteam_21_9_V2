const fs = require('fs');
let code = fs.readFileSync('tests/e2e/classification-realtime.spec.ts', 'utf8');

const dragCode = `
    // Execute drag and drop inside browser
    const dragDrop = async (itemText, groupText, itemId) => {
        await studentPage.evaluate(({ itemText, groupText, itemId }) => {
            const source = Array.from(document.querySelectorAll('div')).find(el => el.textContent === itemText);
            const target = Array.from(document.querySelectorAll('.bg-gray-100')).find(el => el.textContent && el.textContent.includes(groupText));
            
            if (source && target) {
                const dt = new DataTransfer();
                dt.setData('itemId', itemId);
                source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
                target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
            }
        }, { itemText, groupText, itemId });
    };

    await dragDrop("Mục 1", "Nhóm Đúng", "I1");
    await dragDrop("Mục 2", "Nhóm Sai", "I2");
`;

code = code.replace(/    \/\/ HTML5 Drag and Drop workaround.*await dragDrop\("Mục 2", "Nhóm Sai", "I2"\);/s, dragCode);
fs.writeFileSync('tests/e2e/classification-realtime.spec.ts', code, 'utf8');
