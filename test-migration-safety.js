const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { runStartupMigration, hasDbData } = require('./src/lib/dbMigration');

const TEST_DIR = path.join(process.cwd(), 'temp_test_migration');

function cleanTestDir() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

let allPassed = true;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    allPassed = false;
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('====================================================');
console.log('PHASE 1B: MIGRATION SAFETY AUTOMATED TEST SUITE');
console.log('====================================================\n');

try {
  cleanTestDir();

  // ====================================================
  // TEST 1: SECTION 6 - LOCAL MIGRATION (1 Pres, 1 Act)
  // ====================================================
  console.log('--- TEST 1: LOCAL MIGRATION FROM OLD DB TO TARGET DB (SECTION 6) ---');
  const sourceDbPath = path.join(TEST_DIR, 'source_db.json');
  const targetDbPath = path.join(TEST_DIR, 'persistent', 'db.json');

  const sampleSourceData = {
    presentations: [
      {
        id: "pres_phase1b_001",
        teacherId: "teacher_alpha",
        title: "Toán Học Lớp 10 - Đại Số",
        originalFileName: "toan10.pdf",
        fileUrl: "https://storage.example.com/toan10.pdf",
        totalSlides: 12,
        slides: [
          { id: "slide_1", fileUrl: "https://storage.example.com/toan10.pdf", pageNumber: 1 },
          { id: "slide_2", fileUrl: "https://storage.example.com/toan10.pdf", pageNumber: 2 }
        ],
        createdAt: 1790000000000,
        updatedAt: 1790000000000
      }
    ],
    activities: [
      {
        id: "act_phase1b_quiz_99",
        presentationId: "pres_phase1b_001",
        slideId: 2,
        type: "MULTIPLE_CHOICE",
        name: "Kiểm tra trắc nghiệm 15 phút",
        mode: "INDIVIDUAL",
        bonusType: "SPEED",
        bonusPoints: 2,
        timerDuration: 60,
        points: 10,
        gradingMethod: "AUTO",
        allowEdit: false,
        showResults: true,
        permissions: "ALL",
        config: {
          question: "Phương trình x^2 - 4 = 0 có mấy nghiệm?",
          options: [
            { id: "opt_1", text: "1 nghiệm", isCorrect: false },
            { id: "opt_2", text: "2 nghiệm", isCorrect: true }
          ]
        },
        createdAt: 1790000005000,
        updatedAt: 1790000005000
      }
    ],
    classCodes: [{ classId: "CLS_PROD_10A", code: "PROD10" }],
    bonusLedgers: [
      {
        ledgerId: "LED_1001",
        studentId: "STU_01",
        sessionCode: "PROD10",
        classId: "CLS_PROD_10A",
        activityId: "act_phase1b_quiz_99",
        points: 10,
        reason: "QUIZ_CORRECT",
        createdAt: 1790000010000
      }
    ],
    sessionHistories: [],
    activeSessions: {
      "PROD10": { currentSlide: 2, classId: "CLS_PROD_10A" }
    }
  };

  fs.writeFileSync(sourceDbPath, JSON.stringify(sampleSourceData, null, 2), 'utf8');
  assert(!fs.existsSync(targetDbPath), 'Target DB does not exist before migration');

  // Run migration
  const migrationResult1 = runStartupMigration({
    sourcePath: sourceDbPath,
    targetPath: targetDbPath,
    forceRunInTest: true
  });

  assert(migrationResult1.status === 'MIGRATED', 'Migration status is MIGRATED');
  assert(fs.existsSync(targetDbPath), 'Target DB was created');

  // Verify backup exists
  const targetBackup = targetDbPath + '.backup';
  const targetNamedBackup = path.join(path.dirname(targetDbPath), 'db.json.backup');
  assert(fs.existsSync(targetBackup) || fs.existsSync(targetNamedBackup), 'Backup file was created and preserved');

  // Verify target data integrity
  const targetData1 = JSON.parse(fs.readFileSync(targetDbPath, 'utf8'));
  assert(targetData1.presentations.length === 1, 'Target has exactly 1 presentation');
  assert(targetData1.presentations[0].id === 'pres_phase1b_001', 'Presentation ID preserved');
  assert(targetData1.presentations[0].title === 'Toán Học Lớp 10 - Đại Số', 'Presentation Title preserved');
  assert(targetData1.presentations[0].fileUrl === 'https://storage.example.com/toan10.pdf', 'fileUrl preserved');
  assert(targetData1.presentations[0].totalSlides === 12, 'totalSlides preserved');

  assert(targetData1.activities.length === 1, 'Target has exactly 1 activity');
  assert(targetData1.activities[0].id === 'act_phase1b_quiz_99', 'Activity ID preserved');
  assert(targetData1.activities[0].presentationId === 'pres_phase1b_001', 'Activity presentationId preserved');
  assert(targetData1.activities[0].slideId === 2, 'Activity slideId preserved');
  assert(targetData1.activities[0].config.question === 'Phương trình x^2 - 4 = 0 có mấy nghiệm?', 'Activity config preserved');

  assert(targetData1.classCodes.length === 1, 'classCodes preserved');
  assert(targetData1.bonusLedgers.length === 1, 'bonusLedgers preserved');
  assert(targetData1.activeSessions['PROD10'] !== undefined, 'activeSessions preserved');

  console.log('\n--- TEST 2: SECOND RESTART TEST (SECTION 7) ---');
  // Restart process again - Target already exists
  const migrationResult2 = runStartupMigration({
    sourcePath: sourceDbPath,
    targetPath: targetDbPath,
    forceRunInTest: true
  });

  assert(migrationResult2.status === 'TARGET_EXISTS', 'Second run reports TARGET_EXISTS');
  assert(migrationResult2.skipped === true, 'Migration was skipped on second restart');

  const targetData2 = JSON.parse(fs.readFileSync(targetDbPath, 'utf8'));
  assert(targetData2.presentations.length === 1, 'No duplicate presentations after second restart');
  assert(targetData2.activities.length === 1, 'No duplicate activities after second restart');
  assert(targetData2.presentations[0].id === 'pres_phase1b_001', 'IDs remain untouched');
  assert(targetData2.activities[0].id === 'act_phase1b_quiz_99', 'Activity IDs remain untouched');

  console.log('\n--- TEST 3: TEST TARGET DB ALREADY EXISTS WITH DIFFERENT DATA (SECTION 8) ---');
  const conflictTargetDir = path.join(TEST_DIR, 'conflict_target');
  fs.mkdirSync(conflictTargetDir, { recursive: true });
  const conflictTargetPath = path.join(conflictTargetDir, 'db.json');

  const targetExistingData = {
    presentations: [
      {
        id: "pres_EXISTING_TARGET",
        teacherId: "teacher_target",
        title: "Target Existing Data",
        originalFileName: "target.pdf",
        fileUrl: "http://storage.com/target.pdf",
        totalSlides: 5
      }
    ],
    activities: [
      {
        id: "act_EXISTING_TARGET",
        presentationId: "pres_EXISTING_TARGET",
        slideId: 1,
        type: "SHORT_ANSWER"
      }
    ]
  };
  fs.writeFileSync(conflictTargetPath, JSON.stringify(targetExistingData, null, 2), 'utf8');

  // Capture logs
  let capturedLogs = [];
  const origLog = console.log;
  const origWarn = console.warn;
  console.log = (...args) => { capturedLogs.push(args.join(' ')); origLog(...args); };
  console.warn = (...args) => { capturedLogs.push(args.join(' ')); origWarn(...args); };

  const conflictResult = runStartupMigration({
    sourcePath: sourceDbPath,
    targetPath: conflictTargetPath,
    forceRunInTest: true
  });

  console.log = origLog;
  console.warn = origWarn;

  assert(conflictResult.status === 'TARGET_EXISTS', 'Conflict scenario returned TARGET_EXISTS');
  assert(conflictResult.conflict === true, 'Conflict detected between source and target');

  const logStr = capturedLogs.join('\n');
  assert(logStr.includes('TARGET DB EXISTS – MIGRATION SKIPPED'), 'Logged: TARGET DB EXISTS – MIGRATION SKIPPED');
  assert(logStr.includes('MIGRATION CONFLICT – MANUAL DECISION REQUIRED'), 'Logged: MIGRATION CONFLICT – MANUAL DECISION REQUIRED');

  // Ensure target data was NOT overwritten
  const verifyConflictTarget = JSON.parse(fs.readFileSync(conflictTargetPath, 'utf8'));
  assert(verifyConflictTarget.presentations.length === 1, 'Target data count preserved');
  assert(verifyConflictTarget.presentations[0].id === 'pres_EXISTING_TARGET', 'Target was NOT overwritten by source');

  console.log('\n--- TEST 4: TEST DB ISOLATION (SECTION 9) ---');
  // When USE_TEST_DB=true, migration must not run into production
  const testDbResult = runStartupMigration({
    sourcePath: sourceDbPath,
    isTestMode: true
  });
  assert(testDbResult.status === 'SKIPPED_TEST_MODE', 'Migration skipped when USE_TEST_DB=true');

  console.log('\n--- TEST 5: REAL CHILD PROCESS RESTART VERIFICATION ---');
  // Run real node process requiring dbMigration with environment variables
  const procTargetDir = path.join(TEST_DIR, 'proc_target');
  const procTargetPath = path.join(procTargetDir, 'db.json');
  
  const testScript = `
    const { runStartupMigration } = require('./src/lib/dbMigration');
    runStartupMigration();
  `;

  // First process run: Should migrate
  const run1 = spawnSync(process.execPath, ['-e', testScript], {
    env: {
      ...process.env,
      OLD_DB_FILE: sourceDbPath,
      DB_FILE: procTargetPath,
      USE_TEST_DB: 'false'
    },
    encoding: 'utf8'
  });

  console.log('Run 1 stdout:\n', run1.stdout);
  assert(run1.status === 0, 'Process 1 exited successfully');
  assert(run1.stdout.includes('MIGRATION SUCCESSFUL!'), 'Process 1 performed migration');
  assert(fs.existsSync(procTargetPath), 'Process 1 created target DB');

  // Second process run: Should skip with TARGET DB EXISTS
  const run2 = spawnSync(process.execPath, ['-e', testScript], {
    env: {
      ...process.env,
      OLD_DB_FILE: sourceDbPath,
      DB_FILE: procTargetPath,
      USE_TEST_DB: 'false'
    },
    encoding: 'utf8'
  });

  console.log('Run 2 stdout:\n', run2.stdout);
  assert(run2.status === 0, 'Process 2 exited successfully');
  assert(run2.stdout.includes('TARGET DB EXISTS – MIGRATION SKIPPED'), 'Process 2 skipped migration because target exists');

  // Clean up
  cleanTestDir();

  console.log('\n====================================================');
  console.log('ALL MIGRATION SAFETY AUTOMATED TESTS PASSED (5/5)');
  console.log('====================================================\n');
} catch (e) {
  console.error('\n❌ TEST SUITE FAILED:', e);
  process.exit(1);
}
