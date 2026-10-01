const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6 shadow-sm">\s*<h3 className="font-bold text-indigo-900 mb-3 text-lg flex items-center">/;
const replacement = `<div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6 shadow-sm">
<div className="text-xs text-gray-400 mb-2">Debug - SystemId: {systemId || "null"} | GroupCount: {availableGroups?.length || 0} | groupInfo: {groupInfo ? groupInfo.id : "null"}</div>
<h3 className="font-bold text-indigo-900 mb-3 text-lg flex items-center">`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Success");
} else {
    console.log("Not found");
}
