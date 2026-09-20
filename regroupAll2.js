const fs = require('fs');
const xlsx = require('xlsx');

const dir = 'C:/DuAn/EDUTEAM_BO_DU_LIEU_DAU_VAO';
const studentsFile = dir + '/02_DANH_SACH_HOC_SINH.xlsx';
const groupsFile = dir + '/03_NHOM_HOC_SINH.xlsx';

const d2Wb = xlsx.readFile(studentsFile);
const d2Sheet = d2Wb.Sheets[d2Wb.SheetNames[0]];
const allStudents = xlsx.utils.sheet_to_json(d2Sheet);

// Group students by Class
const classMap = {};
for (const s of allStudents) {
    const cName = String(s['Tên lớp'] || '').trim();
    if (!cName || cName === 'undefined') continue;
    if (!classMap[cName]) classMap[cName] = [];
    classMap[cName].push(s);
}

let newGroupsData = [];

for (const cName in classMap) {
    const students = classMap[cName];
    // Calculate number of groups to ensure max 6 students per group
    const numGroups = Math.ceil(students.length / 6);
    
    for (let i = 0; i < students.length; i++) {
        const st = students[i];
        const groupNum = (i % numGroups) + 1;
        const role = Math.floor(i / numGroups) === 0 ? 'Nhóm trưởng' : 'Thành viên';
        
        let idKey = Object.keys(st).find(k => k.includes('Student_ID') || k.includes('Mã HS'));
        let nameKey = Object.keys(st).find(k => k.includes('H') && k.includes('t') && k.includes('n'));
        if (!nameKey) nameKey = 'Họ và tên';
        
        newGroupsData.push({
            Session_ID: 'SES_' + cName.replace('/', ''),
            'Tên nhóm': 'Nhóm ' + groupNum,
            Student_ID: idKey ? String(st[idKey]) : ('HS_' + i),
            'Họ và tên': st[nameKey],
            'Vai trò': role,
            'Quyền thao tác': 'Cùng thao tác'
        });
    }
}

const wbGroups = xlsx.utils.book_new();
const wsGroups = xlsx.utils.json_to_sheet(newGroupsData);
xlsx.utils.book_append_sheet(wbGroups, wsGroups, 'Nhom_Hoc_Sinh');

try {
    xlsx.writeFile(wbGroups, groupsFile);
    console.log('Successfully generated ' + newGroupsData.length + ' group assignments across ' + Object.keys(classMap).length + ' classes in ' + groupsFile);
} catch(e) {
    console.log('Error writing file (EBUSY?).');
}
