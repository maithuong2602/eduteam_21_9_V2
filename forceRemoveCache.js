const fs = require('fs');
let code = fs.readFileSync('src/lib/jsonDb.ts', 'utf8');

const replacement = `
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

// Just manually find and replace the whole block
const startIndex = code.indexOf('let memoryDb: DbSchema | null = null;');
const endIndex = code.indexOf('export const jsonDb = {');
if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + '\n\n' + code.substring(endIndex);
  fs.writeFileSync('src/lib/jsonDb.ts', code);
  console.log('Successfully removed memory cache');
} else {
  console.log('Could not find block bounds');
}
