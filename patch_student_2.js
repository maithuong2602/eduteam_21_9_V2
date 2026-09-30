const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex2 = /    newSocket\.on\("groups_updated", \(groups: any\[\]\) => \{[\s\S]*?newSocket\.on\("group_created", \(groups: any\[\]\) => \{[\s\S]*?    \}\);/g;

content = content.replace(regex2, '    newSocket.on("groups_updated", (groups: any[]) => {\n      setAvailableGroups(groups);\n    });\n    newSocket.on("group_member_joined", (groups: any[]) => {\n      setAvailableGroups(groups);\n    });\n    newSocket.on("group_member_left", (groups: any[]) => {\n      setAvailableGroups(groups);\n    });\n    newSocket.on("group_created", (groups: any[]) => {\n      setAvailableGroups(groups);\n    });');

fs.writeFileSync(file, content);
