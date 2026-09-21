const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const regex = /session\.currentSlide = data\.slideNumber;/;
const replacement = `session.currentSlide = data.slideNumber;\n        session.activityConfig = null; // Clear old activity when slide changes`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.js', code);
console.log('Added activityConfig = null to change_slide');
