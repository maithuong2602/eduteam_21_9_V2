const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const regex = /newSocket\.on\("slide_changed", \(data\) => \{[\s\S]*?\}\);/;
const match = code.match(regex);
if (match) {
    console.log("slide_changed listener is: ", match[0]);
} else {
    console.log("slide_changed listener NOT FOUND");
}
