const fs = require('fs');
let code = fs.readFileSync('src/lib/jsonDb.ts', 'utf8');

code += `

export const jsonDb = {
  getDb,
  saveDb,
  
  // Presentations
  getPresentations: () => getDb().presentations || [],
  getPresentation: (id: string) => (getDb().presentations || []).find(p => p.id === id),
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
  }
};
`;

fs.writeFileSync('src/lib/jsonDb.ts', code);
console.log('Restored jsonDb exports');
