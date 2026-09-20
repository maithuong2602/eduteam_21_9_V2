const xlsx = require('xlsx');

// 1. Load students
const d2Wb = xlsx.readFile('C:/DuAn/EDUTEAM_BO_DU_LIEU_DAU_VAO/02_DANH_SACH_HOC_SINH.xlsx');
const allStudents = xlsx.utils.sheet_to_json(d2Wb.Sheets[d2Wb.SheetNames[0]]);
const allStudentsFromExcel = allStudents.map(row => ({
  id: String(row['Student_ID'] || row['Mã HS']),
  className: row['Tên lớp'] || ''
}));

// 2. Load groups API logic
const groupsWb = xlsx.readFile('C:/DuAn/EDUTEAM_BO_DU_LIEU_DAU_VAO/03_NHOM_HOC_SINH.xlsx');
const groupsData = xlsx.utils.sheet_to_json(groupsWb.Sheets[groupsWb.SheetNames[0]]);
const groupsMap = new Map();
groupsData.forEach(row => {
  const groupId = String(row['Session_ID']) + '_' + String(row['Tên nhóm']);
  if (!groupsMap.has(groupId)) {
    groupsMap.set(groupId, {
      id: groupId,
      name: String(row['Tên nhóm']),
      members: []
    });
  }
  if (row['Student_ID']) {
    groupsMap.get(groupId).members.push({
      studentId: String(row['Student_ID'])
    });
  }
});
const groups = Array.from(groupsMap.values());

// 3. Evaluate filter
const cName = '6/1';
const classGroups = groups.filter((g) => g.className === cName || (g.members && g.members.some((m) => allStudentsFromExcel.find((s) => s.id === m.studentId)?.className === cName)));

console.log('Total groups:', groups.length);
console.log('Filtered groups:', classGroups.length);
if (classGroups.length > 0) {
  console.log('Sample group name:', classGroups[0].name);
}
