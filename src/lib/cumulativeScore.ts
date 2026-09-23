import { jsonDb, SessionHistory } from './jsonDb';

export interface CumulativeParams {
  classId: string;
  studentId?: string;
  topicId?: string;
  lessonId?: string;
}

export interface TopicResult {
  topicId: string;
  score: number;
  sessionIds: string[];
}

export interface LessonResult {
  lessonId: string;
  score: number;
  sessionIds: string[];
}

export interface StudentCumulativeResult {
  studentId: string;
  cumulativeScore: number;
  completedSessionCount: number;
  topics: TopicResult[];
  lessons: LessonResult[];
}

export function calculateCumulativeScore(params: CumulativeParams): StudentCumulativeResult[] {
  const { classId, studentId, topicId, lessonId } = params;
  
  // 1. Fetch all session histories
  const allHistories = jsonDb.getSessionHistories();
  
  // 2. Filter completed sessions for the class
  let validSessions = allHistories.filter(h => 
    h.classId === classId && 
    h.status === 'COMPLETED'
  );

  // 3. Filter by topicId if provided
  if (topicId) {
    validSessions = validSessions.filter(h => h.topicIds && h.topicIds.includes(topicId));
  }
  
  // 4. Filter by lessonId if provided
  if (lessonId) {
    validSessions = validSessions.filter(h => h.lessonIds && h.lessonIds.includes(lessonId));
  }

  // To prevent multiple entries for the same student (if we calculate for all)
  // We first gather all students from valid sessions
  const studentMap = new Map<string, StudentCumulativeResult>();
  
  const initStudent = (sId: string) => {
    if (!studentMap.has(sId)) {
      studentMap.set(sId, {
        studentId: sId,
        cumulativeScore: 0,
        completedSessionCount: 0,
        topics: [],
        lessons: []
      });
    }
    return studentMap.get(sId)!;
  };

  // We need to keep track of processed sessions per student to avoid double-counting
  // However, the rule states: "Session không được tính hai lần". 
  // Since we are iterating over `validSessions`, they are already unique SessionHistory records.
  // We just add each session's score once per student overall.
  
  // If we calculate topic or lesson aggregation, we must ALSO ensure deduplication.
  
  for (const session of validSessions) {
    for (const studentResult of session.students) {
      const sId = String(studentResult.studentId);
      
      // If studentId filter is provided, skip others
      if (studentId && String(studentId) !== sId) continue;
      
      const stData = initStudent(sId);
      const score = studentResult.sessionScore || 0;
      
      // Global cumulative
      stData.cumulativeScore += score;
      stData.completedSessionCount += 1;
      
      // Topic Aggregation
      if (session.topicIds) {
        for (const tId of session.topicIds) {
          let tData = stData.topics.find(t => t.topicId === tId);
          if (!tData) {
            tData = { topicId: tId, score: 0, sessionIds: [] };
            stData.topics.push(tData);
          }
          if (!tData.sessionIds.includes(session.id)) {
            tData.score += score;
            tData.sessionIds.push(session.id);
          }
        }
      }
      
      // Lesson Aggregation
      if (session.lessonIds) {
        for (const lId of session.lessonIds) {
          let lData = stData.lessons.find(l => l.lessonId === lId);
          if (!lData) {
            lData = { lessonId: lId, score: 0, sessionIds: [] };
            stData.lessons.push(lData);
          }
          if (!lData.sessionIds.includes(session.id)) {
            lData.score += score;
            lData.sessionIds.push(session.id);
          }
        }
      }
    }
  }

  // Fix floating point issues (e.g. 1.5 + 1.2 = 2.7, wait JavaScript might do 2.7000000000000006)
  // Round to 4 decimal places maximum but keep as float
  const fixFloat = (num: number) => Math.round(num * 10000) / 10000;
  
  for (const res of studentMap.values()) {
    res.cumulativeScore = fixFloat(res.cumulativeScore);
    for (const t of res.topics) t.score = fixFloat(t.score);
    for (const l of res.lessons) l.score = fixFloat(l.score);
  }

  return Array.from(studentMap.values());
}
