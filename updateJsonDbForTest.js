const fs = require('fs');
let code = fs.readFileSync('src/lib/jsonDb.ts', 'utf8');

const regex = /const DB_FILE = path\.join\(process\.cwd\(\), 'src', 'data', 'db\.json'\);/;
const replacement = `const isTest = process.env.USE_TEST_DB === 'true';
const DB_FILE = path.join(process.cwd(), 'src', 'data', isTest ? 'db.test.json' : 'db.json');`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/lib/jsonDb.ts', code);
  console.log('Updated jsonDb.ts to support USE_TEST_DB');
} else {
  console.log('Could not find DB_FILE definition in jsonDb.ts');
}
