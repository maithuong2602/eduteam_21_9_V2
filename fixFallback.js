const fs = require('fs');
let content = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

// We have several places where we did `classGroups.length > 0 ? classGroups : somethingElse`.
// Let's replace them globally.

content = content.replace(/groups: classGroups\.length > 0 \? classGroups : data\.groups/g, 'groups: classGroups');
content = content.replace(/groups: classGroups\.length > 0 \? classGroups : newGroups/g, 'groups: classGroups');

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', content);
console.log('Fixed the fallback to all groups');
