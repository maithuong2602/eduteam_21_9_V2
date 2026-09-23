import { test, expect } from '@playwright/test';

test.describe('Session History Persistence', () => {
  test('Session and Activity data successfully persist matching the S1-A Data Model', async ({ request }) => {
    
    const mockSessionHistory = {
      id: 'hist_test_' + Date.now(),
      sessionCode: 'TEST_HIST',
      classId: 'CLS001',
      className: 'Lớp 10A1',
      topicIds: ['TOPIC_1'],
      lessonIds: ['LESSON_1', 'LESSON_2'], // Testing multiple lessons
      startedAt: Date.now() - 3600000,
      completedAt: Date.now(),
      status: 'COMPLETED',
      activities: [
        {
          activityId: 'ACT_TEST',
          slideNumber: 7,
          activityType: 'MULTIPLE_CHOICE',
          activityMode: 'INDIVIDUAL',
          maxScore: 1
        }
      ],
      students: [
        {
          studentId: 'HS001',
          studentName: 'Nguyễn Văn A',
          sessionScore: 1,
          activityResults: [
            {
              activityId: 'ACT_TEST',
              activityType: 'MULTIPLE_CHOICE',
              activityMode: 'INDIVIDUAL',
              answer: ['A'], // Raw answer
              score: 1,
              maxScore: 1
            }
          ]
        }
      ]
    };

    // 1. Post to API
    const postRes = await request.post('/api/history', {
      data: mockSessionHistory
    });
    
    expect(postRes.status()).toBe(200);
    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);

    // 2. Fetch from API to assert Persistence
    const getRes = await request.get('/api/history');
    expect(getRes.status()).toBe(200);
    const getBody = await getRes.json();
    
    expect(getBody.histories).toBeDefined();
    const savedHistory = getBody.histories.find((h: any) => h.id === mockSessionHistory.id);
    
    expect(savedHistory).toBeDefined();
    expect(savedHistory.className).toBe('Lớp 10A1');
    expect(savedHistory.lessonIds).toContain('LESSON_1');
    expect(savedHistory.lessonIds).toContain('LESSON_2');
    expect(savedHistory.status).toBe('COMPLETED');
    
    const studentResult = savedHistory.students[0];
    expect(studentResult.studentId).toBe('HS001');
    
    const activityResult = studentResult.activityResults[0];
    expect(activityResult.activityId).toBe('ACT_TEST');
    expect(activityResult.answer).toEqual(['A']);
    expect(activityResult.score).toBe(1);
    expect(activityResult.activityMode).toBe('INDIVIDUAL');
  });
});
