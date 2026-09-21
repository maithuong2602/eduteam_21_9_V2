const fs = require('fs');
let content = fs.readFileSync('src/lib/excelDb.ts', 'utf8');

content = content.replace(
  /'C:\\\\DuAn\\\\EDUTEAM_BO_DU_LIEU_DAU_VAO\\\\02_DANH_SACH_HOC_SINH\.xlsx'/g,
  "require('path').join(process.cwd(), 'src', 'data', '02_DANH_SACH_HOC_SINH.xlsx')"
);

content = content.replace(
  /'C:\\\\DuAn\\\\EDUTEAM_BO_DU_LIEU_DAU_VAO\\\\04_HOAT_DONG\.xlsx'/g,
  "require('path').join(process.cwd(), 'src', 'data', '04_HOAT_DONG.xlsx')"
);

fs.writeFileSync('src/lib/excelDb.ts', content);
console.log('Fixed absolute paths in excelDb.ts');
