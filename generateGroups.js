const fs = require('fs');
const xlsx = require('xlsx');

const dir = 'C:/DuAn/EDUTEAM_BO_DU_LIEU_DAU_VAO';
const studentsFile = dir + '/02_DANH_SACH_HOC_SINH.xlsx';
const groupsFile = dir + '/03_NHOM_HOC_SINH_UPDATE.xlsx';

const d2Wb = xlsx.readFile(studentsFile);
const allStudents = xlsx.utils.sheet_to_json(d2Wb.Sheets['Sheet1']);

let newGroupsData = [];
let generated = 0;

function groupClass(students) {
    const grouped = [];
    const numGroups = 6;
    for (let i = 0; i < students.length; i++) {
        const groupNum = (i % numGroups) + 1;
        const subGroup = i % 2 === 0 ? 'A' : 'B';
        const groupId = groupNum + subGroup;
        grouped.push({
            student: students[i],
            groupNum: groupNum,
            groupId: groupId,
            role: Math.floor(i / numGroups) === 0 ? 'Nhóm trưởng' : 'Thành viên'
        });
    }
    return grouped;
}

const keys = Object.keys(allStudents[0]);
let nameKey = keys.find(k => k.includes('H') && k.includes('t') && k.includes('n'));
if (!nameKey) nameKey = 'Họ và tên';

['Khoi7.xlsx', 'Khoi8.xlsx', 'Khoi9.xlsx'].forEach((file) => {
    const wb = xlsx.readFile(dir + '/' + file);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
    
    let currentClassStudents = [];
    let lastClassName = '';
    
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;
        
        const name = String(row[1]).trim();
        const className = String(row[2]).trim();
        
        if (!name || name === 'undefined' || name === 'null' || name.length < 2) continue;
        if (!className || className === 'undefined' || className === 'Tên lớp') continue;

        if (className !== lastClassName) {
            if (currentClassStudents.length > 0) {
                const grouped = groupClass(currentClassStudents);
                grouped.forEach(g => {
                    newGroupsData.push({
                        Session_ID: 'SES_' + lastClassName.replace('/', ''),
                        'Tên nhóm': 'Nhóm ' + g.groupNum,
                        Student_ID: g.student.Student_ID,
                        'Họ và tên': g.student[nameKey],
                        'Vai trò': g.role,
                        'Quyền thao tác': 'Cùng thao tác'
                    });
                    generated++;
                });
            }
            currentClassStudents = [];
            lastClassName = className;
        }
        
        const st = allStudents.find(s => s[nameKey] && String(s[nameKey]).trim() === name);
        if (st) {
            currentClassStudents.push(st);
        }
    }
    
    if (currentClassStudents.length > 0) {
        const grouped = groupClass(currentClassStudents);
        grouped.forEach(g => {
            newGroupsData.push({
                Session_ID: 'SES_' + lastClassName.replace('/', ''),
                'Tên nhóm': 'Nhóm ' + g.groupNum,
                Student_ID: g.student.Student_ID,
                'Họ và tên': g.student[nameKey],
                'Vai trò': g.role,
                'Quyền thao tác': 'Cùng thao tác'
            });
            generated++;
        });
    }
});

const wbGroups = xlsx.utils.book_new();
const wsGroups = xlsx.utils.json_to_sheet(newGroupsData);
xlsx.utils.book_append_sheet(wbGroups, wsGroups, 'Nhom_Hoc_Sinh');
xlsx.writeFile(wbGroups, groupsFile);

console.log('Successfully generated ' + generated + ' NEW group assignments in ' + groupsFile);
