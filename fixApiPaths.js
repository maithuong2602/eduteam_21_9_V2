const fs = require('fs');
let content = fs.readFileSync('src/app/api/groups/route.ts', 'utf8');
if (!content.includes("import path")) {
  content = content.replace("import fs from 'fs';", "import fs from 'fs';\nimport path from 'path';");
}
content = content.replace(
  /'C:\\\\DuAn\\\\EDUTEAM_BO_DU_LIEU_DAU_VAO\\\\03_NHOM_HOC_SINH\.xlsx'/g,
  "path.join(process.cwd(), 'src', 'data', '03_NHOM_HOC_SINH.xlsx')"
);
fs.writeFileSync('src/app/api/groups/route.ts', content);

let content2 = fs.readFileSync('src/app/api/students/route.ts', 'utf8');
if (!content2.includes("import path")) {
  content2 = content2.replace("import fs from 'fs';", "import fs from 'fs';\nimport path from 'path';");
}
content2 = content2.replace(
  /'C:\\\\DuAn\\\\EDUTEAM_BO_DU_LIEU_DAU_VAO\\\\02_DANH_SACH_HOC_SINH\.xlsx'/g,
  "path.join(process.cwd(), 'src', 'data', '02_DANH_SACH_HOC_SINH.xlsx')"
);
fs.writeFileSync('src/app/api/students/route.ts', content2);
console.log('Fixed API paths');
