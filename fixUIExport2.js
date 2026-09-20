const fs = require('fs');
let fileContent = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldCode1 = `        (data.validStudents || presentation?.validStudents || classStudents)?.forEach((s: any) => {
           statsMap.set(String(s.systemId), { total: 0, act: 0, ind: 0, grp: 0 });`;
const newCode1 = `        (data.validStudents || presentation?.validStudents || classStudents)?.forEach((s: any) => {
           statsMap.set(String(s.id), { total: 0, act: 0, ind: 0, grp: 0 });`;

const oldCode2 = `        const rows = (data.validStudents || presentation?.validStudents || classStudents)?.map((st: any) => {
           const stat = statsMap.get(String(st.systemId)) || { total: 0, act: 0, ind: 0, grp: 0 };
           const row: any = {
             "Mã HS": st.systemId,
             "Tên HS": st.name,`;
const newCode2 = `        const rows = (data.validStudents || presentation?.validStudents || classStudents)?.map((st: any) => {
           const stat = statsMap.get(String(st.id)) || { total: 0, act: 0, ind: 0, grp: 0 };
           const row: any = {
             "Mã HS": st.systemId || st.id,
             "Tên HS": st.name,`;

fileContent = fileContent.replace(oldCode1, newCode1);
fileContent = fileContent.replace(oldCode2, newCode2);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', fileContent);
console.log('Fixed UI export_ledgers_ready ID mismatch');
