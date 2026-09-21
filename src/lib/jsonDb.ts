import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');

export interface Presentation {
  id: string;
  teacherId: string;
  title: string;
  originalFileName: string;
  fileUrl: string;
  totalSlides: number;
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

export interface DbSchema {
  presentations: Presentation[];
  activities: Activity[];
  classCodes: ClassCode[];
  bonusLedgers: BonusLedger[];
}

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
};
