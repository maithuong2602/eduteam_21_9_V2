import { test, expect } from '@playwright/test';
import { calculateActivityScore, ScoreInput } from '../../src/lib/scoreEngine';

test.describe('Score Engine', () => {
  test('Test 1: MCQ đúng -> score > 0', () => {
    const input: ScoreInput = {
      activityType: 'MULTIPLE_CHOICE',
      activityMode: 'INDIVIDUAL',
      activityConfig: {
        points: 2,
        options: [
          { id: '1', isCorrect: true },
          { id: '2', isCorrect: false }
        ]
      },
      studentAnswer: ['1']
    };
    const res = calculateActivityScore(input);
    expect(res.score).toBeGreaterThan(0);
    expect(res.score).toBe(2);
    expect(res.isCorrect).toBe(true);
    expect(res.breakdown).toContain('Correct');
  });

  test('Test 2: MCQ sai -> score = 0', () => {
    const input: ScoreInput = {
      activityType: 'MULTIPLE_CHOICE',
      activityMode: 'INDIVIDUAL',
      activityConfig: {
        points: 2,
        options: [
          { id: '1', isCorrect: true },
          { id: '2', isCorrect: false }
        ]
      },
      studentAnswer: ['2']
    };
    const res = calculateActivityScore(input);
    expect(res.score).toBe(0);
    expect(res.isCorrect).toBe(false);
    expect(res.breakdown).toContain('Incorrect');
  });

  test('Test 3: MaxScore được giữ chính xác với UNSET', () => {
    const input: ScoreInput = {
      activityType: 'SHORT_ANSWER',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'UNSET', 
      activityConfig: { points: 5 },
      studentAnswer: ['My answer']
    };
    const res = calculateActivityScore(input);
    expect(res.maxScore).toBe(5);
    expect(res.score).toBe(5);
    expect(res.isCorrect).toBeNull();
  });

  test('Test 4: Activity breakdown chính xác', () => {
    const input: ScoreInput = {
      activityType: 'CLASSIFICATION',
      activityMode: 'INDIVIDUAL',
      activityConfig: {
        points: 10,
        items: [
          { id: 'item1', correctGroupId: 'groupA' },
          { id: 'item2', correctGroupId: 'groupB' }
        ]
      },
      studentAnswer: { item1: 'groupA', item2: 'groupA' } // 1/2 correct
    };
    const res = calculateActivityScore(input);
    expect(res.score).toBe(5);
    expect(res.isCorrect).toBe(false);
    expect(res.breakdown).toContain('Partial');
    expect(res.breakdown).toContain('1/2');
  });

  test('Test 5: Bonus được tách riêng khỏi activity score', () => {
    const input: ScoreInput = {
      activityType: 'SHORT_ANSWER',
      activityMode: 'INDIVIDUAL',
      activityConfig: { points: 2 },
      studentAnswer: ['Answer'],
      bonusConfig: { hasBonus: true, maxBonusPoints: 3 }
    };
    const res = calculateActivityScore(input);
    expect(res.score).toBe(2);
    expect(res.bonusScore).toBe(3);
    expect(res.totalScore).toBe(5);
  });

  test('Test 6: Individual mode không tạo group score', () => {
    const input: ScoreInput = {
      activityType: 'SHORT_ANSWER',
      activityMode: 'INDIVIDUAL',
      activityConfig: { points: 1 },
      studentAnswer: ['Ans']
    };
    const res = calculateActivityScore(input);
    expect(res.totalScore).toBe(1);
    // There shouldn't be any group-specific leaks in standard output
  });

  test('Test 7: Group mode metadata', () => {
    const input: ScoreInput = {
      activityType: 'SHORT_ANSWER',
      activityMode: 'GROUP',
      activityConfig: { points: 1 },
      studentAnswer: ['Group Ans']
    };
    const res = calculateActivityScore(input);
    expect(res.score).toBe(1);
    expect(res.isCorrect).toBeNull();
  });

  test('Test 8: 2 activities Hoạt động chia 6 điểm -> 3 + 3', () => {
    const input: ScoreInput = {
      activityType: 'SHORT_ANSWER',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'HOAT_DONG',
      totalCategoryActivities: 2,
      activityConfig: {},
      studentAnswer: ['Ans']
    };
    const res = calculateActivityScore(input);
    expect(res.maxScore).toBe(3);
    expect(res.score).toBe(3);
  });

  test('Test 9: activities Hoạt động chia 6 điểm N=1..6', () => {
    const testCases = [
      { N: 1, expected: 6 },
      { N: 2, expected: 3 },
      { N: 3, expected: 2 },
      { N: 4, expected: 1.5 },
      { N: 5, expected: 1.2 },
      { N: 6, expected: 1 }
    ];
    
    testCases.forEach(({ N, expected }) => {
      const input: ScoreInput = {
        activityType: 'SHORT_ANSWER',
        activityMode: 'INDIVIDUAL',
        activityCategory: 'HOAT_DONG',
        totalCategoryActivities: N,
        activityConfig: {},
        studentAnswer: ['Ans']
      };
      const res = calculateActivityScore(input);
      expect(res.maxScore).toBe(expected);
      expect(res.score).toBe(expected);
      expect(res.isCorrect).toBeNull();
      expect(res.breakdown).toContain('Responded');
    });
  });

  test('Test 10: Score không vượt quá maxScore', () => {
    const input: ScoreInput = {
      activityType: 'CLASSIFICATION',
      activityMode: 'INDIVIDUAL',
      activityConfig: {
        points: 4,
        items: [
          { id: 'item1', correctGroupId: 'groupA' },
          { id: 'item2', correctGroupId: 'groupB' }
        ]
      },
      studentAnswer: { item1: 'groupA', item2: 'groupB' } // 2/2 correct
    };
    const res = calculateActivityScore(input);
    expect(res.score).toBe(4); // Even if they got 100%, it doesn't exceed 4
    expect(res.maxScore).toBe(4);
  });
});
