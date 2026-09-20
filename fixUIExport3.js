const fs = require('fs');
let fileContent = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldCode = `        const rows = (data.validStudents || presentation?.validStudents || classStudents)?.map((st: any) => {
           const stat = statsMap.get(String(st.id)) || { total: 0, act: 0, ind: 0, grp: 0 };
           const row: any = {
             "Mã HS": st.systemId || st.id,
             "Tên HS": st.name,
             "Lớp": classList.find((c: any) => c.id === selectedClass)?.name || "N/A",
             "Tổng điểm": stat.total,
             "Activity Score": stat.act,
             "Individual Bonus": stat.ind,
             "Group Bonus": stat.grp
           };
           
           data.history.forEach((h: any) => {
             const actName = h.name || \`Slide \${h.slideNumber}\`;
             row[\`Điểm hoạt động \${actName}\`] = h.pointsRecord ? (h.pointsRecord[st.systemId] || 0) : 0;
           });
           return row;
        });`;
        
const newCode = `        const rows = (data.validStudents || presentation?.validStudents || classStudents)?.map((st: any) => {
           const statSys = statsMap.get(String(st.systemId)) || { total: 0, act: 0, ind: 0, grp: 0 };
           const statId = statsMap.get(String(st.id)) || { total: 0, act: 0, ind: 0, grp: 0 };
           const stat = {
             total: statSys.total + statId.total,
             act: statSys.act + statId.act,
             ind: statSys.ind + statId.ind,
             grp: statSys.grp + statId.grp
           };
           
           const row: any = {
             "Mã HS": st.systemId || st.id,
             "Tên HS": st.name,
             "Lớp": classList.find((c: any) => c.id === selectedClass)?.name || "N/A",
             "Tổng điểm": stat.total,
             "Activity Score": stat.act,
             "Individual Bonus": stat.ind,
             "Group Bonus": stat.grp
           };
           
           data.history.forEach((h: any) => {
             const actName = h.name || \`Slide \${h.slideNumber}\`;
             // pointsRecord may use systemId or id
             const pts = (h.pointsRecord && (h.pointsRecord[st.systemId] || h.pointsRecord[st.id])) || 0;
             row[\`Điểm hoạt động \${actName}\`] = pts;
             row["Tổng điểm"] += pts; // Add activity score to total
           });
           return row;
        });`;

fileContent = fileContent.replace(oldCode, newCode);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', fileContent);
console.log('Fixed UI export_ledgers_ready ID mapping and Total sum');
