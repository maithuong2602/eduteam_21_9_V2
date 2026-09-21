const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const approveRegex = /activityDetails:\s*\{\s*slideNumber:\s*selectedSlide,\s*type:\s*currentActivity\.type,\s*name:\s*currentActivity\.name\s*\|\|\s*`HD\$\{selectedSlide\}`,\s*mode:\s*currentActivity\.mode\s*\|\|\s*'INDIVIDUAL',\s*bonusType:\s*currentActivity\.bonusType\s*\|\|\s*'NONE',\s*bonusPoints:\s*currentActivity\.bonusPoints\s*\|\|\s*0,\s*date:\s*new\s*Date\(\)\.toLocaleString\('vi-VN'\),\s*responses:\s*responses\s*\}/;

const approveReplacement = `activityDetails: {
          slideNumber: selectedSlide,
          type: currentActivity.type,
          name: currentActivity.name || \`HD\${selectedSlide}\`,
          mode: currentActivity.mode || 'INDIVIDUAL',
          bonusType: currentActivity.bonusType || 'NONE',
          bonusPoints: currentActivity.bonusPoints || 0,
          date: new Date().toLocaleString('vi-VN'),
          responses: (() => {
             const formatted: Record<string, any> = {};
             Object.entries(responses).forEach(([socketId, ans]) => {
                const student = students.find(s => s.id === socketId);
                const sysId = student ? student.systemId : socketId;
                
                let ansText = typeof ans === 'object' ? JSON.stringify(ans) : String(ans);
                if (currentActivity?.type === 'MULTIPLE_CHOICE') {
                  const ansIds = Array.isArray(ans) ? ans : [ans];
                  ansText = ansIds.map((optId: any) => {
                    const idx = (currentActivity.options || []).findIndex((o:any) => o.id === optId);
                    return idx >= 0 ? String.fromCharCode(65 + idx) : '';
                  }).join(', ');
                } else if (currentActivity?.type === 'WORD_CLOUD' || currentActivity?.type === 'SHORT_ANSWER') {
                  ansText = Array.isArray(ans) ? ans.join(', ') : String(ans);
                }
                
                formatted[sysId] = ansText;
             });
             return formatted;
          })()
        }`;

code = code.replace(approveRegex, approveReplacement);

const exportRegex = /const activityRows = Object\.values\(activities\)\.map\(\(act:\s*any\)\s*=>\s*\(\{[\s\S]*?\}\)\);/;

const exportReplacement = `const activityRows = (data.validStudents || presentation?.validStudents || classStudents)?.map((st: any) => {
           const row: any = {
             "Mã HS": st.systemId || st.id,
             "Tên HS": st.name,
             "Lớp": data.className || "N/A",
             "Nhóm": (data.groups || groups).find((g: any) => g.members && g.members.some((m: any) => m.studentId === st.id))?.name || "Chưa có nhóm"
           };
           data.history.forEach((h: any) => {
             const actName = h.name || \`Slide \${h.slideNumber}\`;
             const studentAns = (h.responses && (h.responses[st.systemId] || h.responses[st.id])) || '';
             row[\`Đáp án \${actName}\`] = studentAns;
           });
           return row;
        });`;

code = code.replace(exportRegex, exportReplacement);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Successfully updated Excel Export for student answers');
