const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('import { Send, CheckCircle, Trophy , Users} from "lucide-react";\r\n', '');
content = content.replace('import { Send, CheckCircle, Trophy , Users} from "lucide-react";\n', '');
content = content.replace('import { Send, CheckCircle, Trophy , Users} from "lucide-react";', '');

fs.writeFileSync(file, content);
console.log('Success');
