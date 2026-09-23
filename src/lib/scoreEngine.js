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
 * Calculates the maximum score for the activity based on category and rules.
 * @param {ScoreInput} input 
 * @returns {number}
 */
function calculateMaxScore(input) {
  if (input.activityCategory === 'KHOI_DONG') return 1;
  if (input.activityCategory === 'HOAT_DONG') {
    const total = input.totalCategoryActivities || 1;
    // Exactly 6 divided by N
    return 6 / total;
  }
  if (input.activityCategory === 'LUYEN_TAP') return 3;
  if (input.activityCategory === 'VAN_DUNG') return 1;
  if (input.activityCategory === 'BONUS') return 3;
  
  // UNSET or Fallback to configured points or default to 1
  return input.activityConfig?.points || 1;
}

/**
 * Main function to evaluate a student's answer and generate a score.
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
    const studentAnsIds = Array.isArray(ans) ? ans : (ans ? [ans] : []);
    
    isCorrect = correctIds.length > 0 && 
                correctIds.length === studentAnsIds.length && 
                correctIds.every((id) => studentAnsIds.includes(id));
    
    score = isCorrect ? maxScore : 0;
    breakdown = isCorrect ? `Correct (+${score})` : 'Incorrect (0)';
  } 
  else if (input.activityType === 'SHORT_ANSWER' || input.activityType === 'WORD_CLOUD') {
    // Current semantics: Just having an answer counts as a response. We don't grade correctness.
    const hasResponse = Array.isArray(ans) ? ans.length > 0 && ans[0] !== "" && ans[0] !== null : ans !== "" && ans !== null && ans !== undefined;
    isCorrect = null; // We cannot determine correctness
    
    if (input.activityType === 'WORD_CLOUD') {
       // Based on rules: Word Cloud is usually not right/wrong. Keep current semantics (gives score if responded).
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
      score = (correctCount / totalItems) * maxScore;
      // Round to 2 decimal places to avoid floating point anomalies in display if needed
      score = Math.round(score * 100) / 100;
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
     // Topic bonus max 3 points. For simplicity in S2-A, if they get the activity correct or responded, give the bonus.
     if (isCorrect === true || (isCorrect === null && score > 0)) {
       const maxB = input.bonusConfig.maxBonusPoints || 3;
       bonusScore = maxB;
     }
  }

  return {
    score,
    maxScore,
    isCorrect,
    breakdown,
    bonusScore: bonusScore > 0 ? bonusScore : undefined,
    totalScore: score + bonusScore
  };
}

module.exports = {
  calculateMaxScore,
  calculateActivityScore
};
