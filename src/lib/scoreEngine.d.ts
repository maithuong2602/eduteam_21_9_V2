export interface ScoreInput {
  activityType: string;
  activityMode: string;
  activityCategory?: string;
  totalCategoryActivities?: number;
  studentAnswer: any;
  activityConfig: any;
  bonusConfig?: {
    hasMindMap?: boolean;
    hasBonus?: boolean;
    maxBonusPoints?: number;
  };
}

export interface ScoreResult {
  score: number;
  maxScore: number;
  isCorrect: boolean | null;
  breakdown: string;
  bonusScore?: number;
  totalScore: number;
}

export function cleanScore(val: number): number;
export function calculateMaxScore(input: ScoreInput): number;
export function calculateActivityScore(input: ScoreInput): ScoreResult;
