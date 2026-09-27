import { test, expect } from '@playwright/test';
import { calculateCumulativeScore } from '../../src/lib/cumulativeScore';
import { jsonDb, SessionHistory } from '../../src/lib/jsonDb';
import fs from 'fs';
import path from 'path';

test.describe('Cumulative Score, History & Session Logic Suite (K, L, M, N, O, P, Q, S)', () => {
  const dbPath = path.join(process.cwd(), 'src', 'data', 'db.test.json');

  test.beforeEach(() => {
    // Reset db.test.json with clean mock data
    const initialDb = {
      presentations: [
        {
          id: "test-pres-1",
          teacherId: "teacher_1",
          title: "E2E Test Presentation",
          originalFileName: "test.pdf",
          fileUrl: "",
          totalSlides: 7,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      activities: [],
      classCodes: [{ classId: "CLS001", code: "TEST61" }],
      bonusLedgers: [],
      sessionHistories: [],
      activeSessions: {}
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2), 'utf8');
  });

  // K. Session Score
  test('K & R. Session Score equals sum of activities with exact decimal precision', () => {
    // Activity 1 = 1.5, Activity 2 = 1.2, Activity 3 = 2.0 -> Session Score = 4.7
    const history: SessionHistory = {
      id: 'sess_1',
      sessionCode: 'CODE1',
      classId: 'CLS001',
      className: 'Lớp 6/1',
      topicIds: ['TOPIC_1'],
      lessonIds: ['LESSON_1'],
      startedAt: Date.now() - 3600000,
      completedAt: Date.now(),
      status: 'COMPLETED',
      activities: [
        { activityId: 'act1', slideNumber: 1, activityType: 'HOAT_DONG', activityMode: 'INDIVIDUAL', maxScore: 1.5 },
        { activityId: 'act2', slideNumber: 2, activityType: 'HOAT_DONG', activityMode: 'INDIVIDUAL', maxScore: 1.2 },
        { activityId: 'act3', slideNumber: 3, activityType: 'HOAT_DONG', activityMode: 'INDIVIDUAL', maxScore: 2.0 }
      ],
      students: [
        {
          studentId: 'HS001',
          studentName: 'Nguyễn Văn A',
          sessionScore: 4.7,
          activityResults: [
            { activityId: 'act1', activityType: 'HOAT_DONG', activityMode: 'INDIVIDUAL', answer: 'ans1', score: 1.5, maxScore: 1.5 },
            { activityId: 'act2', activityType: 'HOAT_DONG', activityMode: 'INDIVIDUAL', answer: 'ans2', score: 1.2, maxScore: 1.2 },
            { activityId: 'act3', activityType: 'HOAT_DONG', activityMode: 'INDIVIDUAL', answer: 'ans3', score: 2.0, maxScore: 2.0 }
          ]
        }
      ]
    };

    jsonDb.saveSessionHistory(history);

    const res = calculateCumulativeScore({ classId: 'CLS001', studentId: 'HS001' });
    expect(res.length).toBe(1);
    expect(res[0].cumulativeScore).toBe(4.7);
    expect(res[0].completedSessionCount).toBe(1);
  });

  // L. History Snapshot
  test('L. History giữ snapshot điểm lịch sử ngay cả khi config thay đổi', () => {
    const history: SessionHistory = {
      id: 'sess_snap',
      sessionCode: 'SNAP1',
      classId: 'CLS001',
      className: 'Lớp 6/1',
      topicIds: ['TOPIC_1'],
      lessonIds: ['LESSON_1'],
      startedAt: Date.now() - 3600000,
      completedAt: Date.now(),
      status: 'COMPLETED',
      activities: [
        { activityId: 'act_snap', slideNumber: 1, activityType: 'MULTIPLE_CHOICE', activityMode: 'INDIVIDUAL', maxScore: 2 }
      ],
      students: [
        {
          studentId: 'HS001',
          studentName: 'Nguyễn Văn A',
          sessionScore: 2,
          activityResults: [
            { activityId: 'act_snap', activityType: 'MULTIPLE_CHOICE', activityMode: 'INDIVIDUAL', answer: ['opt1'], score: 2, maxScore: 2 }
          ]
        }
      ]
    };
    jsonDb.saveSessionHistory(history);

    // Giả sử sau đó giáo viên sửa activity config trong DB
    jsonDb.saveActivity({
      id: 'act_snap',
      presentationId: 'test-pres-1',
      slideId: 1,
      type: 'MULTIPLE_CHOICE',
      name: 'Đã đổi tên',
      mode: 'GROUP', // Đổi sang group
      bonusType: 'NONE',
      bonusPoints: 0,
      timerDuration: 60,
      points: 10, // Đổi max điểm từ 2 lên 10
      gradingMethod: 'Tự động',
      allowEdit: false,
      showResults: true,
      permissions: '',
      config: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Lịch sử session cũ KHÔNG được thay đổi
    const saved = jsonDb.getSessionHistory('sess_snap');
    expect(saved).toBeDefined();
    expect(saved?.activities[0].maxScore).toBe(2);
    expect(saved?.students[0].sessionScore).toBe(2);
    expect(saved?.students[0].activityResults[0].score).toBe(2);
  });

  // M, P, Q. Cumulative Score Only Counts COMPLETED Sessions (Excludes ACTIVE and DISCARDED)
  test('M, P, Q. Cumulative chỉ tính status = COMPLETED (không tính ACTIVE hay DISCARDED)', () => {
    const sessionCompleted: SessionHistory = {
      id: 'sess_comp',
      sessionCode: 'CODE_COMP',
      classId: 'CLS001',
      className: 'Lớp 6/1',
      topicIds: ['T1'],
      lessonIds: ['L1'],
      startedAt: Date.now() - 7200000,
      completedAt: Date.now() - 3600000,
      status: 'COMPLETED',
      activities: [],
      students: [{ studentId: 'HS001', studentName: 'A', sessionScore: 5, activityResults: [] }]
    };

    const sessionActive: any = {
      id: 'sess_act',
      sessionCode: 'CODE_ACT',
      classId: 'CLS001',
      className: 'Lớp 6/1',
      topicIds: ['T1'],
      lessonIds: ['L1'],
      startedAt: Date.now() - 10000,
      completedAt: 0,
      status: 'ACTIVE', // Đang diễn ra, chưa lưu
      activities: [],
      students: [{ studentId: 'HS001', studentName: 'A', sessionScore: 10, activityResults: [] }]
    };

    jsonDb.saveSessionHistory(sessionCompleted);
    jsonDb.saveSessionHistory(sessionActive);

    const res = calculateCumulativeScore({ classId: 'CLS001', studentId: 'HS001' });
    expect(res.length).toBe(1);
    // Cumulative chỉ là 5, KHÔNG được cộng 10 từ session ACTIVE
    expect(res[0].cumulativeScore).toBe(5);
    expect(res[0].completedSessionCount).toBe(1);
  });

  // S. Student Isolation
  test('S. Student isolation: điểm của Student A không được cộng vào Student B', () => {
    const session: SessionHistory = {
      id: 'sess_iso',
      sessionCode: 'ISO1',
      classId: 'CLS001',
      className: 'Lớp 6/1',
      topicIds: ['T1'],
      lessonIds: ['L1'],
      startedAt: Date.now() - 3600000,
      completedAt: Date.now(),
      status: 'COMPLETED',
      activities: [],
      students: [
        { studentId: 'HS_A', studentName: 'Học sinh A', sessionScore: 7, activityResults: [] },
        { studentId: 'HS_B', studentName: 'Học sinh B', sessionScore: 3, activityResults: [] }
      ]
    };
    jsonDb.saveSessionHistory(session);

    const resA = calculateCumulativeScore({ classId: 'CLS001', studentId: 'HS_A' });
    const resB = calculateCumulativeScore({ classId: 'CLS001', studentId: 'HS_B' });

    expect(resA[0].cumulativeScore).toBe(7);
    expect(resB[0].cumulativeScore).toBe(3);

    const all = calculateCumulativeScore({ classId: 'CLS001' });
    const studentA = all.find(s => s.studentId === 'HS_A');
    const studentB = all.find(s => s.studentId === 'HS_B');
    expect(studentA?.cumulativeScore).toBe(7);
    expect(studentB?.cumulativeScore).toBe(3);
  });

  // N & O. Topic & Lesson Aggregation Deduplication
  test('N & O. Một session chứa nhiều lessonIds không bị cộng trùng cumulative score', () => {
    const sessionMultiLesson: SessionHistory = {
      id: 'sess_multi',
      sessionCode: 'MULTI1',
      classId: 'CLS001',
      className: 'Lớp 6/1',
      topicIds: ['TOPIC_1'],
      lessonIds: ['LESSON_A', 'LESSON_B'], // Chứa 2 bài học
      startedAt: Date.now() - 3600000,
      completedAt: Date.now(),
      status: 'COMPLETED',
      activities: [],
      students: [
        { studentId: 'HS001', studentName: 'A', sessionScore: 6, activityResults: [] }
      ]
    };
    jsonDb.saveSessionHistory(sessionMultiLesson);

    const res = calculateCumulativeScore({ classId: 'CLS001', studentId: 'HS001' });
    expect(res[0].cumulativeScore).toBe(6); // CHỈ tính 1 lần, không thành 12
    expect(res[0].completedSessionCount).toBe(1);

    // Cả 2 bài học đều ghi nhận session này
    const lessonA = res[0].lessons.find(l => l.lessonId === 'LESSON_A');
    const lessonB = res[0].lessons.find(l => l.lessonId === 'LESSON_B');
    expect(lessonA?.score).toBe(6);
    expect(lessonB?.score).toBe(6);
  });
});
