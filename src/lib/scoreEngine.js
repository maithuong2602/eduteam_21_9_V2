/**
 * @typedef {Object} ScoreInput
 * @property {string} activityType
 * @property {string} activityMode
 * @property {string} [activityCategory]
 * @property {number} [totalCategoryActivities]
 * @property {any} studentAnswer
 * @property {any} activityConfig
 * @property {{hasMindMap?: boolean, hasBonus?: boolean, maxBonusPoints?: number}} [bonusConfig]
 */

/**
 * @typedef {Object} ScoreResult
 * @property {number} score
 * @property {number} maxScore
 * @property {boolean|null} isCorrect
 * @property {string} breakdown
 * @property {number} [bonusScore]
 * @property {number} totalScore
 */

/**
 * Helper to clean decimal points to prevent floating point inaccuracies.
 * @param {number} val 
 * @returns {number}
 */
function cleanScore(val) {
  return Math.round((Number(val) || 0) * 10000) / 10000;
}

/**
 * Calculates the maximum score for the activity based on category and rules.
 * @param {ScoreInput} input 
 * @returns {number}
 */
function calculateMaxScore(input) {
  if (!input) return 1;
  if (input.activityCategory === 'KHOI_DONG') return 1;
  if (input.activityCategory === 'HOAT_DONG') {
    const total = Math.max(1, Number(input.totalCategoryActivities) || 1);
    // Exactly 6 divided by N (N=1 -> 6, N=2 -> 3, N=3 -> 2, N=4 -> 1.5, N=5 -> 1.2, N=6 -> 1)
    return cleanScore(6 / total);
  }
  if (input.activityCategory === 'LUYEN_TAP') return 3;
  if (input.activityCategory === 'VAN_DUNG') return 1;
  if (input.activityCategory === 'BONUS') {
    return cleanScore(Number(input.bonusConfig?.maxBonusPoints) || 3);
  }
  
  // UNSET or Fallback to configured points or default to 1
  return cleanScore(Number(input.activityConfig?.points) || 1);
}

/**
 * Main function to evaluate a student's answer and generate an authoritative score.
 * @param {ScoreInput} input
 * @returns {ScoreResult}
 */
function calculateActivityScore(input) {
  const maxScore = calculateMaxScore(input);
  let score = 0;
  let isCorrect = false;
  let breakdown = '';

  const ans = input.studentAnswer;

  if (input.activityType === 'MULTIPLE_CHOICE') {
    const correctIds = (input.activityConfig?.options || [])
      .filter((o) => o.isCorrect)
      .map((o) => o.id);
    const studentAnsIds = Array.isArray(ans) ? ans : (ans !== undefined && ans !== null && ans !== '' ? [ans] : []);
    
    isCorrect = correctIds.length > 0 && 
                correctIds.length === studentAnsIds.length && 
                correctIds.every((id) => studentAnsIds.includes(id));
    
    score = isCorrect ? maxScore : 0;
    breakdown = isCorrect ? `Correct (+${score})` : 'Incorrect (0)';
  } 
  else if (input.activityType === 'SHORT_ANSWER' || input.activityType === 'WORD_CLOUD') {
    // Current semantics: Just having an answer counts as a response.
    // NOTE: There is currently NO AI grading for Short Answer and Word Cloud.
    // Therefore, isCorrect is strictly null (cannot judge correctness automatically).
    const hasResponse = Array.isArray(ans) 
      ? ans.length > 0 && ans[0] !== "" && ans[0] !== null && ans[0] !== undefined
      : ans !== "" && ans !== null && ans !== undefined;
      
    isCorrect = null; // We cannot determine correctness automatically
    
    if (input.activityType === 'WORD_CLOUD') {
       score = hasResponse ? maxScore : 0;
       breakdown = hasResponse ? `Responded (+${score})` : 'No valid response (0)';
    } else {
       // SHORT_ANSWER
       score = hasResponse ? maxScore : 0;
       breakdown = hasResponse ? `Responded (+${score})` : 'No valid response (0)';
    }
  } 
  else if (input.activityType === 'CLASSIFICATION') {
    const items = input.activityConfig?.items || [];
    const totalItems = items.length;
    let correctCount = 0;
    
    if (totalItems > 0 && typeof ans === 'object' && ans !== null && !Array.isArray(ans)) {
      items.forEach((item) => {
        if (ans[item.id] === item.correctGroupId) {
          correctCount++;
        }
      });
      isCorrect = correctCount === totalItems;
      score = cleanScore((correctCount / totalItems) * maxScore);
      breakdown = correctCount === totalItems ? `Correct (+${score})` : 
                 (correctCount > 0 ? `Partial (${correctCount}/${totalItems} items, +${score})` : 'Incorrect (0)');
    } else {
      isCorrect = false;
      score = 0;
      breakdown = 'Incorrect/No response (0)';
    }
  } else {
    // Unknown activity type
    score = 0;
    isCorrect = null;
    breakdown = 'Unknown activity type (0)';
  }

  // Bonus calculation
  let bonusScore = 0;
  if (input.bonusConfig?.hasMindMap || input.bonusConfig?.hasBonus) {
     if (isCorrect === true || (isCorrect === null && score > 0)) {
       const maxB = Number(input.bonusConfig.maxBonusPoints) || 3;
       bonusScore = cleanScore(maxB);
     }
  }

  return {
    score: cleanScore(score),
    maxScore: cleanScore(maxScore),
    isCorrect,
    breakdown,
    bonusScore: bonusScore > 0 ? cleanScore(bonusScore) : undefined,
    totalScore: cleanScore(score + bonusScore)
  };
}

module.exports = {
  cleanScore,
  calculateMaxScore,
  calculateActivityScore
};
