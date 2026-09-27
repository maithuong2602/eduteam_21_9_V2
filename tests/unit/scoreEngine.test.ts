import { test, expect } from '@playwright/test';
import { calculateActivityScore, calculateMaxScore, cleanScore, ScoreInput } from '../../src/lib/scoreEngine';

test.describe('Score Engine Complete Suite (A-T)', () => {
  // A. Score Engine Unit Tests
  test('A. Score Engine basic calculation and cleanScore', () => {
    expect(cleanScore(1.5 + 1.2 + 2)).toBe(4.7);
    expect(cleanScore(0.1 + 0.2)).toBe(0.3);
  });

  // B. Multiple Choice
  test('B1. MCQ đúng hoàn toàn -> score = maxScore, isCorrect = true', () => {
    const input: ScoreInput = {
      activityType: 'MULTIPLE_CHOICE',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'KHOI_DONG',
      activityConfig: {
        options: [
          { id: 'opt1', isCorrect: true },
          { id: 'opt2', isCorrect: false }
        ]
      },
      studentAnswer: ['opt1']
    };
    const res = calculateActivityScore(input);
    expect(res.maxScore).toBe(1); // KHOI_DONG = 1
    expect(res.score).toBe(1);
    expect(res.isCorrect).toBe(true);
    expect(res.breakdown).toContain('Correct');
  });

  test('B2. MCQ sai -> score = 0, isCorrect = false', () => {
    const input: ScoreInput = {
      activityType: 'MULTIPLE_CHOICE',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'LUYEN_TAP',
      activityConfig: {
        options: [
          { id: 'opt1', isCorrect: true },
          { id: 'opt2', isCorrect: false }
        ]
      },
      studentAnswer: ['opt2']
    };
    const res = calculateActivityScore(input);
    expect(res.maxScore).toBe(3); // LUYEN_TAP = 3
    expect(res.score).toBe(0);
    expect(res.isCorrect).toBe(false);
    expect(res.breakdown).toContain('Incorrect');
  });

  test('B3. MCQ chọn thừa hoặc thiếu đáp án -> score = 0', () => {
    const input: ScoreInput = {
      activityType: 'MULTIPLE_CHOICE',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'VAN_DUNG',
      activityConfig: {
        options: [
          { id: 'opt1', isCorrect: true },
          { id: 'opt2', isCorrect: true },
          { id: 'opt3', isCorrect: false }
        ]
      },
      studentAnswer: ['opt1'] // thiếu opt2
    };
    const res = calculateActivityScore(input);
    expect(res.maxScore).toBe(1); // VAN_DUNG = 1
    expect(res.score).toBe(0);
    expect(res.isCorrect).toBe(false);
  });

  // C. Short Answer
  test('C1. Short Answer có phản hồi -> score = maxScore, isCorrect = null (No AI Grading)', () => {
    const input: ScoreInput = {
      activityType: 'SHORT_ANSWER',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'HOAT_DONG',
      totalCategoryActivities: 3, // 6 / 3 = 2
      activityConfig: {},
      studentAnswer: 'Dap an cua em'
    };
    const res = calculateActivityScore(input);
    expect(res.maxScore).toBe(2);
    expect(res.score).toBe(2);
    expect(res.isCorrect).toBeNull(); // Không tự ý chấm đúng/sai vì chưa có AI grading
    expect(res.breakdown).toContain('Responded');
  });

  test('C2. Short Answer rỗng -> score = 0, isCorrect = null', () => {
    const input: ScoreInput = {
      activityType: 'SHORT_ANSWER',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'HOAT_DONG',
      totalCategoryActivities: 3,
      activityConfig: {},
      studentAnswer: ''
    };
    const res = calculateActivityScore(input);
    expect(res.score).toBe(0);
    expect(res.isCorrect).toBeNull();
    expect(res.breakdown).toContain('No valid response');
  });

  // D. Classification
  test('D1. Classification đúng hoàn toàn -> score = maxScore, isCorrect = true', () => {
    const input: ScoreInput = {
      activityType: 'CLASSIFICATION',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'HOAT_DONG',
      totalCategoryActivities: 2, // 6 / 2 = 3
      activityConfig: {
        items: [
          { id: 'item1', correctGroupId: 'g1' },
          { id: 'item2', correctGroupId: 'g2' }
        ]
      },
      studentAnswer: { item1: 'g1', item2: 'g2' }
    };
    const res = calculateActivityScore(input);
    expect(res.maxScore).toBe(3);
    expect(res.score).toBe(3);
    expect(res.isCorrect).toBe(true);
    expect(res.breakdown).toContain('Correct');
  });

  test('D2. Classification đúng 1 phần -> điểm tỷ lệ, isCorrect = false', () => {
    const input: ScoreInput = {
      activityType: 'CLASSIFICATION',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'HOAT_DONG',
      totalCategoryActivities: 2, // 6 / 2 = 3
      activityConfig: {
        items: [
          { id: 'item1', correctGroupId: 'g1' },
          { id: 'item2', correctGroupId: 'g2' }
        ]
      },
      studentAnswer: { item1: 'g1', item2: 'wrong_group' }
    };
    const res = calculateActivityScore(input);
    expect(res.maxScore).toBe(3);
    expect(res.score).toBe(1.5); // 1/2 of 3 = 1.5
    expect(res.isCorrect).toBe(false);
    expect(res.breakdown).toContain('Partial (1/2 items, +1.5)');
  });

  // E. Word Cloud
  test('E. Word Cloud có phản hồi -> score = maxScore, isCorrect = null', () => {
    const input: ScoreInput = {
      activityType: 'WORD_CLOUD',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'KHOI_DONG',
      activityConfig: {},
      studentAnswer: ['Sáng tạo']
    };
    const res = calculateActivityScore(input);
    expect(res.maxScore).toBe(1);
    expect(res.score).toBe(1);
    expect(res.isCorrect).toBeNull();
    expect(res.breakdown).toContain('Responded');
  });

  // F. Individual Mode
  test('F. Individual mode độc lập, không sinh group score', () => {
    const input: ScoreInput = {
      activityType: 'MULTIPLE_CHOICE',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'KHOI_DONG',
      activityConfig: {
        options: [{ id: 'optA', isCorrect: true }]
      },
      studentAnswer: 'optA'
    };
    const res = calculateActivityScore(input);
    expect(res.totalScore).toBe(1);
  });

  // G. Group Mode & Bonus
  test('G. Group mode tính đúng activity score và bonus riêng biệt', () => {
    const input: ScoreInput = {
      activityType: 'SHORT_ANSWER',
      activityMode: 'GROUP',
      activityCategory: 'HOAT_DONG',
      totalCategoryActivities: 4, // 6 / 4 = 1.5
      activityConfig: {},
      studentAnswer: { text: 'Nhóm 1 nộp bài' },
      bonusConfig: { hasBonus: true, maxBonusPoints: 1 }
    };
    const res = calculateActivityScore(input);
    expect(res.maxScore).toBe(1.5);
    expect(res.score).toBe(1.5);
    expect(res.bonusScore).toBe(1);
    expect(res.totalScore).toBe(2.5);
  });

  // Category Formulas Verification: N=1..6
  test('HOAT_DONG category formulas N=1..6 chia chính xác 6 điểm', () => {
    const expectedScores = [
      { N: 1, expected: 6 },
      { N: 2, expected: 3 },
      { N: 3, expected: 2 },
      { N: 4, expected: 1.5 },
      { N: 5, expected: 1.2 },
      { N: 6, expected: 1 }
    ];

    expectedScores.forEach(({ N, expected }) => {
      const max = calculateMaxScore({
        activityType: 'SHORT_ANSWER',
        activityMode: 'INDIVIDUAL',
        activityCategory: 'HOAT_DONG',
        totalCategoryActivities: N,
        activityConfig: {},
        studentAnswer: 'ans'
      });
      expect(max).toBe(expected);
    });
  });

  // R. Decimal Score Precision
  test('R. Decimal scores không bị trôi số dấu phẩy động (1.5 + 1.2 + 2 = 4.7)', () => {
    const sum = cleanScore(1.5 + 1.2 + 2);
    expect(sum).toBe(4.7);
    expect(String(sum)).toBe('4.7');
  });

  // T. Backend Authoritative
  test('T. Backend authoritative score: bỏ qua các trường điểm client giả mạo', () => {
    const input: any = {
      activityType: 'MULTIPLE_CHOICE',
      activityMode: 'INDIVIDUAL',
      activityCategory: 'KHOI_DONG',
      points: 999999, // client giả mạo
      clientScore: 999999,
      activityConfig: {
        points: 999999, // client cố gửi points 999999 nhưng category là KHOI_DONG
        options: [{ id: 'opt1', isCorrect: false }]
      },
      studentAnswer: ['opt1']
    };
    const res = calculateActivityScore(input);
    // Vì KHOI_DONG = 1 và học sinh trả lời sai opt1 -> điểm thực tế phải là 0
    expect(res.maxScore).toBe(1);
    expect(res.score).toBe(0);
    expect(res.totalScore).toBe(0);
    expect(res.score).not.toBe(999999);
  });
});
