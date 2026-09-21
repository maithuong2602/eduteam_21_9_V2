const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const effectMatch = code.match(/useEffect\(\(\) => \{[\s\S]*?const newSocket = io\(undefined\);[\s\S]*?return \(\) => \{[\s\S]*?newSocket\.disconnect\(\);[\s\S]*?\}\s*\}, \[.*?\]\);/);
if (effectMatch) {
   console.log("Found useEffect dependencies:", effectMatch[0].substring(effectMatch[0].lastIndexOf('}')));
} else {
   console.log("Could not find full useEffect");
}
