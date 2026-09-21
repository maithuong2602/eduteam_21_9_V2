const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const regex = /items: currentActivity\.items,\s*categories: currentActivity\.categories,\s*options: currentActivity\.options/;

const replacement = `items: currentActivity.items,
          categories: currentActivity.categories,
          groups: currentActivity.groups,
          settings: currentActivity.settings,
          options: currentActivity.options`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Fixed start_activity payload to include groups and settings');
