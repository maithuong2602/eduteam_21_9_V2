import fs from 'fs';
import path from 'path';

async function globalSetup() {
  if (process.env.NODE_ENV === 'production' || (process.env.DB_FILE && process.env.DB_FILE.includes('/var/lib/eduteam'))) {
    throw new Error('FATAL: Tests are strictly forbidden from running in production or against production DB_FILE!');
  }
  console.log('Resetting test database...');
  const dbPath = path.join(process.cwd(), 'src', 'data', 'db.test.json');
  const initialDb = {
    presentations: [
      {
        id: "test-pres-1",
        teacherId: "teacher_1",
        title: "E2E Test Presentation",
        originalFileName: "test.pdf",
        fileUrl: "", // Trống để không render PdfViewer (tránh crash do fetch failed)
        totalSlides: 7,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ],
    activities: [
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
  ],
    classCodes: [
      {
        classId: "CLS001",
        code: "TEST61"
      }
    ],
    bonusLedgers: []
  };
  fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2), 'utf8');
}

export default globalSetup;
