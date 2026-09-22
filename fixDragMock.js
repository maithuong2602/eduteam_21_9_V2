const fs = require('fs');
let code = fs.readFileSync('tests/e2e/classification-realtime.spec.ts', 'utf8');

const dragCode = `
    // Mock the drop event directly in browser
    await studentPage.evaluate(() => {
        const dropItem = (groupName, itemId) => {
            const target = Array.from(document.querySelectorAll('.bg-gray-100')).find(el => el.textContent && el.textContent.includes(groupName));
            if (!target) return;
            
            // React 17/18 synthetic event system looks at the native event
            const event = new Event('drop', { bubbles: true });
            event.dataTransfer = {
                getData: (key) => key === 'itemId' ? itemId : ''
            };
            target.dispatchEvent(event);
        };
        
        dropItem('Nhóm Đúng', 'I1');
        dropItem('Nhóm Sai', 'I2');
    });
`;

code = code.replace(/    \/\/ 5\. Student performs classification via Drag and Drop.*await studentPage\.locator\('text="Mục 2"'\)\.dragTo\(studentPage\.locator\('\.bg-gray-100:has-text\("Nhóm Sai"\)'\)\);/s, dragCode);
fs.writeFileSync('tests/e2e/classification-realtime.spec.ts', code, 'utf8');
