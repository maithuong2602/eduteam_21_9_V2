const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const regex = /if \(currentActivity\.type === "MULTIPLE_CHOICE"\) \{[\s\S]*?\} else if \(currentActivity\.type === "WORD_CLOUD" \|\| currentActivity\.type === "SHORT_ANSWER"\) \{[\s\S]*?\}/;

const newScoring = `if (currentActivity.type === "MULTIPLE_CHOICE") {
          const correctIds = (currentActivity.options || []).filter((o:any) => o.isCorrect).map((o:any) => o.id);
          const studentAnsIds = Array.isArray(ans) ? ans : [ans];
          isCorrect = correctIds.length > 0 && correctIds.length === studentAnsIds.length && correctIds.every((id:any) => studentAnsIds.includes(id));
        } else if (currentActivity.type === "WORD_CLOUD" || currentActivity.type === "SHORT_ANSWER") {
          isCorrect = Array.isArray(ans) ? ans.length > 0 && ans[0] !== "" : ans !== "";
        } else if (currentActivity.type === "CLASSIFICATION") {
          // CLASSIFICATION scoring: 
          // ans is a workspaceState object mapping itemId -> groupId.
          // Calculate partial correctness: what % of items are in the correct group?
          const items = currentActivity.items || [];
          let correctCount = 0;
          let totalItems = items.length;
          if (totalItems > 0 && typeof ans === 'object') {
             items.forEach((item: any) => {
               if (ans[item.id] === item.correctGroupId) correctCount++;
             });
             isCorrect = correctCount === totalItems;
          }
        }`;

code = code.replace(regex, newScoring);

// Wait, I also need to update the partial scoring logic inside handleApprovePoints
// Currently it does:
// if (type === 'correct_only') {
//   newApproved[socketId] = isCorrect ? points : (points * 0.5);
// }
// For classification, maybe we want proportional scoring?
// Let's modify it safely.
const partialRegex = /else if \(type === 'correct_only'\) \{[\s\S]*?newApproved\[socketId\] = isCorrect \? points : \(points \* 0\.5\);[\s\S]*?typesMap\[socketId\] = isCorrect \? 'FULL' : 'PARTIAL';[\s\S]*?\}/;

const newPartial = `else if (type === 'correct_only') {
          if (currentActivity.type === "CLASSIFICATION") {
             const items = currentActivity.items || [];
             let correctCount = 0;
             if (items.length > 0 && typeof ans === 'object') {
                items.forEach((item: any) => {
                   if (ans[item.id] === item.correctGroupId) correctCount++;
                });
                const proportionalPoints = Math.round((correctCount / items.length) * points);
                newApproved[socketId] = proportionalPoints;
                typesMap[socketId] = correctCount === items.length ? 'FULL' : (correctCount > 0 ? 'PARTIAL' : 'INCORRECT');
             } else {
                newApproved[socketId] = 0;
                typesMap[socketId] = 'INCORRECT';
             }
          } else {
             newApproved[socketId] = isCorrect ? points : (points * 0.5);
             typesMap[socketId] = isCorrect ? 'FULL' : 'PARTIAL';
          }
        }`;

code = code.replace(partialRegex, newPartial);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Fixed scoring logic for CLASSIFICATION');
