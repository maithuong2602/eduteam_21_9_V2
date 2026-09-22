const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

code = code.replace(
  "// setWorkspaceState(newState); // MUTATION: Disabled state update",
  "setWorkspaceState(newState);"
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code, 'utf8');
