const fs = require('fs');
let code = fs.readFileSync('src/lib/jsonDb.ts', 'utf8');

const originalDbLogic = `
function getDb(): DbSchema {
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbSchema = {
      presentations: [],
      activities: [],
      classCodes: [],
      bonusLedgers: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data) as DbSchema;
  } catch (e) {
    console.error('Error parsing db.json', e);
    return { presentations: [], activities: [], classCodes: [], bonusLedgers: [] };
  }
}

function saveDb(data: DbSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}
`;

// Replace the cached logic
code = code.replace(
  /let memoryDb: DbSchema \| null = null;\s*function getDb\(\): DbSchema \{[\s\S]*?function saveDb\(data: DbSchema\) \{[\s\S]*?\}\s*(?=export const jsonDb)/,
  originalDbLogic.trim() + "\n\n"
);

fs.writeFileSync('src/lib/jsonDb.ts', code);
console.log('Removed memory cache from jsonDb.ts');
