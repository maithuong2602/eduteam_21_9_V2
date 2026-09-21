const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const regex = /items: data\.items,\s*categories: data\.categories,\s*presentationType: data\.presentationType,/g;
const replacement = `items: data.items,
        categories: data.categories,
        groups: data.groups,
        settings: data.settings,
        presentationType: data.presentationType,`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.js', code);
console.log('Added groups and settings to server.js start_activity');
