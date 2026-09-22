const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

// Intentionally break handleWorkspaceChange by commenting out setWorkspaceState
code = code.replace(
  "setWorkspaceState(prev => {",
  "// setWorkspaceState(prev => {"
);
code = code.replace(
  "const next = { ...prev };",
  "// const next = { ...prev };"
);
code = code.replace(
  "if (groupId === null) {",
  "/* if (groupId === null) {"
);
code = code.replace(
  "return next;\n    });",
  "return next;\n    }); */"
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code, 'utf8');
