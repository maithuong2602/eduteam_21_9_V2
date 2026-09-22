const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const regex = /let ansText = typeof ans === 'object' \? JSON\.stringify\(ans\) : String\(ans\);\s*ansText = Array\.isArray\(ans\) \? ans\.join\(\', \'\) : String\(ans\);/g;

const replacement = `let ansText = typeof ans === 'object' ? JSON.stringify(ans) : String(ans);
                            if (currentActivity?.type === 'CLASSIFICATION') {
                              if (typeof ans === 'object' && ans !== null && !Array.isArray(ans)) {
                                 const items = currentActivity.items || [];
                                 const groups = currentActivity.groups || [];
                                 const lines: string[] = [];
                                 items.forEach((it: any) => {
                                    const placedGroupId = ans[it.id];
                                    if (placedGroupId) {
                                       const gName = groups.find((g:any) => g.id === placedGroupId)?.name || placedGroupId;
                                       lines.push(it.text + ' \u2192 ' + gName);
                                    } else {
                                       lines.push(it.text + ' \u2192 (ChÆ°a ph\u00E2n lo\u1EA1i)');
                                    }
                                 });
                                 ansText = lines.join('\\n');
                              }
                            } else {
                               ansText = Array.isArray(ans) ? ans.join(', ') : String(ans);
                            }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Fixed ansText logic in Padlet layout');
