const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const regex = /\} else if \(currentActivity\?\.type === 'WORD_CLOUD' \|\| currentActivity\?\.type === 'SHORT_ANSWER'\) \{\s*ansText = Array\.isArray\(ans\) \? ans\.join\('\, '\) : String\(ans\);\s*\}/g;

const newFormat = `} else if (currentActivity?.type === 'WORD_CLOUD' || currentActivity?.type === 'SHORT_ANSWER') {
                  ansText = Array.isArray(ans) ? ans.join(', ') : String(ans);
                } else if (currentActivity?.type === 'CLASSIFICATION') {
                  if (typeof ans === 'object' && ans !== null && !Array.isArray(ans)) {
                     const items = currentActivity.items || [];
                     const groups = currentActivity.groups || [];
                     const lines: string[] = [];
                     items.forEach((it: any) => {
                        const placedGroupId = ans[it.id];
                        if (placedGroupId) {
                           const gName = groups.find((g:any) => g.id === placedGroupId)?.name || placedGroupId;
                           lines.push(\`\${it.text} → \${gName}\`);
                        } else {
                           lines.push(\`\${it.text} → (Chưa phân loại)\`);
                        }
                     });
                     ansText = lines.join('\\n');
                  }
                }`;

// Replace will only replace occurrences. Since we already replaced it in the UI rendering, 
// let's do it universally (both approve_points and the UI rendering will have it now).
code = code.replace(regex, newFormat);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Fixed formatting logic for approve_points');
