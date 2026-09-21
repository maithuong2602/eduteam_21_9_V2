const fs = require('fs');
let code = fs.readFileSync('src/lib/jsonDb.ts', 'utf8');

const cacheLogic = `
let memoryDb: DbSchema | null = null;

function getDb(): DbSchema {
  if (memoryDb) return memoryDb;
  
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbSchema = {
      presentations: [],
      activities: [],
      classCodes: [],
      bonusLedgers: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    memoryDb = initial;
    return initial;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    memoryDb = JSON.parse(data);
    return memoryDb as DbSchema;
  } catch (e) {
    console.error('Error parsing db.json', e);
    memoryDb = { presentations: [], activities: [], classCodes: [], bonusLedgers: [] };
    return memoryDb;
  }
}

function saveDb(data: DbSchema) {
  memoryDb = data;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}
`;

// Replace the original getDb and saveDb functions
code = code.replace(
  /function getDb\(\): DbSchema \{[\s\S]*?function saveDb\(data: DbSchema\) \{[\s\S]*?\}\s*\}/,
  cacheLogic.trim()
);

fs.writeFileSync('src/lib/jsonDb.ts', code);
console.log('Added memory cache to jsonDb');
