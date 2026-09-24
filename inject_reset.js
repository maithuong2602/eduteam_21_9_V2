const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, 'tests', 'e2e');
const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.spec.ts'));

for (const file of files) {
  const filePath = path.join(e2eDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already injected
  if (content.includes('/api/test/reset')) {
    console.log(`Skipping ${file}`);
    continue;
  }

  // Find test.describe block
  const describeRegex = /test\.describe\(['"`].*?['"`],\s*\(\)\s*=>\s*\{/;
  const match = content.match(describeRegex);
  
  if (match) {
    const injectStr = `\n  test.beforeEach(async ({ request }) => {\n    await request.get('/api/test/reset');\n  });\n`;
    content = content.slice(0, match.index + match[0].length) + injectStr + content.slice(match.index + match[0].length);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Injected into ${file}`);
  } else {
    console.log(`No test.describe found in ${file}`);
  }
}
