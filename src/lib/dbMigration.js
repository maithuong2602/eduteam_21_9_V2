const fs = require('fs');
const path = require('path');

function hasDbData(db) {
  if (!db || typeof db !== 'object') return false;
  const hasPres = Array.isArray(db.presentations) && db.presentations.length > 0;
  const hasActs = Array.isArray(db.activities) && db.activities.length > 0;
  const hasClassCodes = Array.isArray(db.classCodes) && db.classCodes.length > 0;
  const hasBonus = Array.isArray(db.bonusLedgers) && db.bonusLedgers.length > 0;
  const hasHist = Array.isArray(db.sessionHistories) && db.sessionHistories.length > 0;
  const hasSessions = db.activeSessions && typeof db.activeSessions === 'object' && Object.keys(db.activeSessions).length > 0;
  return Boolean(hasPres || hasActs || hasClassCodes || hasBonus || hasHist || hasSessions);
}

function runStartupMigration(options = {}) {
  const isTestMode = options.isTestMode !== undefined ? options.isTestMode : process.env.USE_TEST_DB === 'true';

  // Rule 9: Isolation when USE_TEST_DB=true
  if (isTestMode && !options.forceRunInTest) {
    console.log('[MIGRATION] USE_TEST_DB=true detected. Migration bypassed for test isolation.');
    return { status: 'SKIPPED_TEST_MODE' };
  }

  const defaultSourcePath = process.env.OLD_DB_FILE || path.join(process.cwd(), 'src', 'data', 'db.json');
  const defaultTargetPath = isTestMode
    ? path.join(process.cwd(), 'src', 'data', 'db.test.json')
    : (process.env.DB_FILE || defaultSourcePath);

  const sourcePath = path.resolve(options.sourcePath || defaultSourcePath);
  const targetPath = path.resolve(options.targetPath || defaultTargetPath);

  // If source and target are the exact same file, no migration needed
  if (sourcePath === targetPath) {
    return { status: 'SAME_FILE', targetPath };
  }

  // Prevent multiple redundant executions in the same process when using default paths
  if (!options.sourcePath && !options.targetPath && global.__eduteam_migration_completed) {
    return global.__eduteam_migration_result;
  }

  console.log(`[MIGRATION] Checking migration from ${sourcePath} -> ${targetPath}...`);

  const targetExists = fs.existsSync(targetPath);
  const sourceExists = fs.existsSync(sourcePath);

  let sourceData = null;
  if (sourceExists) {
    try {
      sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    } catch (e) {
      console.error(`[MIGRATION] Failed to read/parse source DB (${sourcePath}):`, e.message);
    }
  }

  let targetData = null;
  if (targetExists) {
    try {
      targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    } catch (e) {
      console.error(`[MIGRATION] Failed to read/parse target DB (${targetPath}):`, e.message);
    }
  }

  const sourceHasData = hasDbData(sourceData);
  const targetHasData = hasDbData(targetData);

  // RULE 5 & 8: Target DB already exists
  if (targetExists) {
    console.log('[MIGRATION] TARGET DB EXISTS – MIGRATION SKIPPED');
    if (sourceHasData && targetHasData) {
      console.warn('[MIGRATION] MIGRATION CONFLICT – MANUAL DECISION REQUIRED');
      console.warn(`[MIGRATION] Both source (${sourcePath}) and target (${targetPath}) contain data. Target DB will NOT be overwritten.`);
    }
    const result = {
      status: 'TARGET_EXISTS',
      skipped: true,
      conflict: Boolean(sourceHasData && targetHasData),
      targetPath
    };
    if (!options.sourcePath && !options.targetPath) {
      global.__eduteam_migration_completed = true;
      global.__eduteam_migration_result = result;
    }
    return result;
  }

  // RULE 2 & 5: Target DB does not exist
  if (sourceExists && sourceHasData) {
    console.log(`[MIGRATION] Target DB does not exist and source DB has data. Initiating migration...`);
    
    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // RULE 4: Backup creation before migration
    const sourceBackup = sourcePath + '.backup';
    const namedBackup = path.join(path.dirname(sourcePath), 'db.json.backup');
    const targetBackup = targetPath + '.backup';
    const targetNamedBackup = path.join(targetDir, 'db.json.backup');

    try {
      const serialized = JSON.stringify(sourceData, null, 2);
      fs.writeFileSync(sourceBackup, serialized, 'utf8');
      fs.writeFileSync(namedBackup, serialized, 'utf8');
      fs.writeFileSync(targetBackup, serialized, 'utf8');
      fs.writeFileSync(targetNamedBackup, serialized, 'utf8');
      console.log(`[MIGRATION] Backups created successfully:`);
      console.log(`  - Source Backup: ${sourceBackup}`);
      console.log(`  - Named Backup:  ${namedBackup}`);
      console.log(`  - Target Backup: ${targetBackup}`);
    } catch (err) {
      console.error('[MIGRATION] Failed to create database backups:', err.message);
      throw new Error(`Migration aborted: Could not create backups. ${err.message}`);
    }

    // Migrate: write data to target DB
    fs.writeFileSync(targetPath, JSON.stringify(sourceData, null, 2), 'utf8');

    // Verify written data
    const verified = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    const presCount = (verified.presentations || []).length;
    const actCount = (verified.activities || []).length;
    const classCount = (verified.classCodes || []).length;
    const bonusCount = (verified.bonusLedgers || []).length;

    console.log(`[MIGRATION] MIGRATION SUCCESSFUL!`);
    console.log(`[MIGRATION] Target: ${targetPath}`);
    console.log(`[MIGRATION] Preserved: ${presCount} presentations, ${actCount} activities, ${classCount} classCodes, ${bonusCount} bonusLedgers.`);

    const result = {
      status: 'MIGRATED',
      presCount,
      actCount,
      targetPath
    };
    if (!options.sourcePath && !options.targetPath) {
      global.__eduteam_migration_completed = true;
      global.__eduteam_migration_result = result;
    }
    return result;
  }

  // Target does not exist, and source has no data
  console.log(`[MIGRATION] Target DB does not exist and source has no data. Initializing clean target DB.`);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const emptyDb = {
    presentations: [],
    activities: [],
    classCodes: [],
    bonusLedgers: [],
    sessionHistories: [],
    activeSessions: {}
  };
  fs.writeFileSync(targetPath, JSON.stringify(emptyDb, null, 2), 'utf8');

  const result = {
    status: 'INITIALIZED_EMPTY',
    targetPath
  };
  if (!options.sourcePath && !options.targetPath) {
    global.__eduteam_migration_completed = true;
    global.__eduteam_migration_result = result;
  }
  return result;
}

module.exports = {
  runStartupMigration,
  hasDbData
};
