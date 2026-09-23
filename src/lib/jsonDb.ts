import fs from 'fs';
import path from 'path';

const isTest = process.env.USE_TEST_DB === 'true';
const DB_FILE = path.join(process.cwd(), 'src', 'data', isTest ? 'db.test.json' : 'db.json');

export interface Presentation {
  id: string;
  teacherId: string;
  title: string;
  originalFileName: string;
  fileUrl: string;
  totalSlides: number;
  slides?: { id: string, fileUrl: string, pageNumber: number }[];
  createdAt: number;
  updatedAt: number;
}

export interface Activity {
  id: string;
  presentationId: string;
  slideId: number;
  type: string;
  name: string;
  mode: string;
  bonusType: string;
  bonusPoints: number;
  timerDuration: number;
  points: number;
  gradingMethod: string;
  allowEdit: boolean;
  showResults: boolean;
  permissions: string;
  config: any; // specific config
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ClassCode {
  classId: string;
  code: string;
}

export interface BonusLedger {
  ledgerId: string;
  classId: string;
  studentId: string;
  sessionCode: string;
  activityId: string;
  points: number;
  reason: string;
  type: 'BONUS' | 'PENALTY' | 'RESET';
  createdAt: number;
}

export interface ActivityResult {
  activityId: string;
  activityType: string;
  activityMode: string;
  answer: any;
  score: number;
  maxScore: number;
  groupId?: string;
  groupName?: string;
  groupScore?: number;
  individualScore?: number;
}

export interface StudentSessionResult {
  studentId: string;
  studentName: string;
  sessionScore: number;
  activityResults: ActivityResult[];
}

export interface ActivityHistorySnapshot {
  activityId: string;
  slideNumber: number;
  activityType: string;
  activityMode: string;
  maxScore: number;
}

export interface SessionHistory {
  id: string;
  sessionCode: string;
  classId: string;
  className: string;
  topicIds: string[];
  lessonIds: string[];
  startedAt: number;
  completedAt: number;
  status: 'ACTIVE' | 'COMPLETED';
  activities: ActivityHistorySnapshot[];
  students: StudentSessionResult[];
}

export interface DbSchema {
  presentations: Presentation[];
  activities: Activity[];
  classCodes: ClassCode[];
  bonusLedgers: BonusLedger[];
  sessionHistories: SessionHistory[];
}


function getDb(): DbSchema {
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbSchema = {
      presentations: [],
      activities: [],
      classCodes: [],
      bonusLedgers: [],
      sessionHistories: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data) as DbSchema;
  } catch (e) {
    console.error('Error parsing db.json', e);
    return { presentations: [], activities: [], classCodes: [], bonusLedgers: [], sessionHistories: [] };
  }
}

function saveDb(data: DbSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}


export const jsonDb = {
  getDb,
  saveDb,
  
  // Presentations
  getPresentations: () => getDb().presentations || [],
  getPresentation: (id: string) => {
    const db = getDb();
    const p = (db.presentations || []).find(p => p.id === id);
    if (p && !p.slides) {
      p.slides = Array.from({ length: p.totalSlides || 0 }).map((_, i) => ({
        id: "slide_" + Date.now() + "_" + i,
        fileUrl: p.fileUrl,
        pageNumber: i + 1
      }));
      jsonDb.savePresentation(p);
    }
    return p;
  },
  savePresentation: (p: Presentation) => {
    const db = getDb();
    if (!db.presentations) db.presentations = [];
    const idx = db.presentations.findIndex(x => x.id === p.id);
    if (idx >= 0) db.presentations[idx] = p;
    else db.presentations.push(p);
    saveDb(db);
  },
  
  // Activities
  getActivitiesByPresentation: (presentationId: string) => (getDb().activities || []).filter(a => a.presentationId === presentationId),
  saveActivity: (a: Activity) => {
    const db = getDb();
    if (!db.activities) db.activities = [];
    const idx = db.activities.findIndex(x => x.id === a.id);
    if (idx >= 0) db.activities[idx] = a;
    else db.activities.push(a);
    saveDb(db);
  },
  deleteActivity: (id: string) => {
    const db = getDb();
    if (db.activities) db.activities = db.activities.filter(a => a.id !== id);
    saveDb(db);
  },

  // Class Codes
  getClassCode: (classId: string) => {
    const db = getDb();
    if (!db.classCodes) db.classCodes = [];
    let cc = db.classCodes.find(c => c.classId === classId);
    if (!cc) {
      cc = { classId, code: Math.random().toString(36).substring(2, 8).toUpperCase() };
      db.classCodes.push(cc);
      saveDb(db);
    }
    return cc.code;
  },
  
  // Ledgers
  addLedger: (ledger: BonusLedger) => {
    const db = getDb();
    if (!db.bonusLedgers) db.bonusLedgers = [];
    db.bonusLedgers.push(ledger);
    saveDb(db);
  },
  getLedgersByClass: (classId: string) => (getDb().bonusLedgers || []).filter(l => l.classId === classId),
  resetBonusForClass: (classId: string, teacherId: string) => {
    const db = getDb();
    if (!db.bonusLedgers) db.bonusLedgers = [];
    db.bonusLedgers.push({
      ledgerId: 'RST_' + Date.now(),
      classId,
      studentId: 'ALL',
      sessionCode: 'RESET',
      activityId: 'RESET',
      points: 0,
      reason: 'Teacher Reset',
      type: 'RESET',
      createdAt: Date.now()
    });
    saveDb(db);
  },
  
  // Session History
  getSessionHistories: () => getDb().sessionHistories || [],
  getSessionHistory: (id: string) => {
    return (getDb().sessionHistories || []).find(h => h.id === id);
  },
  saveSessionHistory: (history: SessionHistory) => {
    const db = getDb();
    if (!db.sessionHistories) db.sessionHistories = [];
    const idx = db.sessionHistories.findIndex(h => h.id === history.id);
    if (idx >= 0) db.sessionHistories[idx] = history;
    else db.sessionHistories.push(history);
    saveDb(db);
  }
};
