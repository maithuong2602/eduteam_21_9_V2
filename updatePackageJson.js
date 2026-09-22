const fs = require('fs');

let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  "test:api": "playwright test tests/api/",
  "test:e2e": "playwright test tests/e2e/",
  "test:quick": "playwright test tests/api/ smoke.spec.ts",
  "auto-check": "npm run test:api && npm run test:e2e"
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');
console.log('Updated package.json scripts');
