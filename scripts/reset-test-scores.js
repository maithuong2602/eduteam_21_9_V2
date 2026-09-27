const fs = require('fs');
const path = require('path');

const testDbPath = path.join(__dirname, '..', 'src', 'data', 'db.test.json');
const bakDbPath = path.join(__dirname, '..', 'src', 'data', 'db.test.json.bak');

console.log('--- SCORE-1 TEST DB RESET ---');

// 1. Read existing state
let beforeDb = { presentations: [], activities: [], classCodes: [], bonusLedgers: [], sessionHistories: [], activeSessions: {} };
if (fs.existsSync(testDbPath)) {
  try {
    beforeDb = JSON.parse(fs.readFileSync(testDbPath, 'utf8'));
  } catch(e) {
    console.error('Error reading testDb:', e);
  }
}

// Check if presentations/activities are empty in testDb, recover templates from bak if needed
let presentations = beforeDb.presentations || [];
let activities = beforeDb.activities || [];
let classCodes = beforeDb.classCodes || [];

if (presentations.length === 0 && fs.existsSync(bakDbPath)) {
  try {
    const bak = JSON.parse(fs.readFileSync(bakDbPath, 'utf8'));
    presentations = bak.presentations || [];
    activities = bak.activities || [];
    classCodes = bak.classCodes || [];
  } catch(e) {}
}

// Fallback template if still empty
if (presentations.length === 0) {
  presentations = [
    {
      id: "test-pres-1",
      teacherId: "teacher_1",
      title: "E2E Test Presentation",
      originalFileName: "test.pdf",
      fileUrl: "",
      totalSlides: 7,
      createdAt: 1790214693593,
      updatedAt: 1790214693593
    }
  ];
  activities = [
    {
      id: "ACT_TEST_CLASS",
      presentationId: "test-pres-1",
      slideId: 3,
      type: "CLASSIFICATION",
      mode: "INDIVIDUAL",
      groups: [
        { id: "G1", name: "Nhóm Đúng" },
        { id: "G2", name: "Nhóm Sai" }
      ],
      items: [
        { id: "I1", text: "Mục 1", correctGroupId: "G1" },
        { id: "I2", text: "Mục 2", correctGroupId: "G2" }
      ],
      settings: { allowMoveBack: true }
    },
    {
      id: "ACT_TEST_SHORT_ANSWER",
      presentationId: "test-pres-1",
      slideId: 4,
      type: "SHORT_ANSWER",
      mode: "INDIVIDUAL"
    },
    {
      id: "ACT_TEST_WORD_CLOUD",
      presentationId: "test-pres-1",
      slideId: 5,
      type: "WORD_CLOUD",
      mode: "INDIVIDUAL"
    },
    {
      id: "ACT_TEST_LOCK",
      presentationId: "test-pres-1",
      slideId: 6,
      type: "MULTIPLE_CHOICE",
      mode: "INDIVIDUAL",
      options: [
        { id: "OPT1", text: "Option A", isCorrect: true },
        { id: "OPT2", text: "Option B", isCorrect: false }
      ]
    },
    {
      id: "ACT_TEST_RECONNECT",
      presentationId: "test-pres-1",
      slideId: 7,
      type: "MULTIPLE_CHOICE",
      mode: "INDIVIDUAL",
      options: [
        { id: "OPT1", text: "Option A", isCorrect: true },
        { id: "OPT2", text: "Option B", isCorrect: false }
      ]
    }
  ];
  classCodes = [
    { classId: "CLS001", code: "TEST61" }
  ];
}

console.log('BEFORE RESET:');
console.log('  File:', testDbPath);
console.log('  Presentations:', (beforeDb.presentations || []).length);
console.log('  Activities:', (beforeDb.activities || []).length);
console.log('  ClassCodes:', (beforeDb.classCodes || []).length);
console.log('  SessionHistories:', (beforeDb.sessionHistories || []).length);
console.log('  BonusLedgers:', (beforeDb.bonusLedgers || []).length);
console.log('  ActiveSessions:', Object.keys(beforeDb.activeSessions || {}).length);

const afterDb = {
  presentations: presentations,
  activities: activities,
  classCodes: classCodes.length > 0 ? classCodes : [{ classId: "CLS001", code: "TEST61" }],
  bonusLedgers: [],
  sessionHistories: [],
  activeSessions: {}
};

fs.writeFileSync(testDbPath, JSON.stringify(afterDb, null, 2), 'utf8');

console.log('AFTER RESET:');
console.log('  File:', testDbPath);
console.log('  Presentations:', afterDb.presentations.length);
console.log('  Activities:', afterDb.activities.length);
console.log('  ClassCodes:', afterDb.classCodes.length);
console.log('  SessionHistories:', afterDb.sessionHistories.length, '(All score history wiped to empty)');
console.log('  BonusLedgers:', afterDb.bonusLedgers.length, '(All bonus points wiped to empty)');
console.log('  ActiveSessions:', Object.keys(afterDb.activeSessions).length, '(All active sessions reset)');
console.log('  Points / Cumulative Scores: 0');
