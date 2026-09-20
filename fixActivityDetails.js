const fs = require('fs');

// 1. Update Teacher UI page.tsx
let uiContent = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const oldModalEmit = `                    socket.emit('approve_group_points', {
                      code: sessionCode,
                      activityId: currentActivityId,
                      scores: { [groupApprovalModal.groupId]: currentActivity?.points || 1 },
                      approvedMembers: { [groupApprovalModal.groupId]: groupApprovalModal.selectedMembers }
                    });`;
const newModalEmit = `                    socket.emit('approve_group_points', {
                      code: sessionCode,
                      activityId: currentActivityId,
                      scores: { [groupApprovalModal.groupId]: currentActivity?.points || 1 },
                      approvedMembers: { [groupApprovalModal.groupId]: groupApprovalModal.selectedMembers },
                      activityDetails: {
                        slideNumber: selectedSlide,
                        type: currentActivity?.type,
                        name: currentActivity?.name || \`HD\${selectedSlide}\`,
                        mode: currentActivity?.mode || 'GROUP',
                        bonusType: currentActivity?.bonusType || 'NONE',
                        bonusPoints: currentActivity?.bonusPoints || 0
                      }
                    });`;

const oldGlobalEmit = `    socket.emit('approve_group_points', {
      code: sessionCode,
      activityId: currentActivityId,
      scores
    });`;
const newGlobalEmit = `    socket.emit('approve_group_points', {
      code: sessionCode,
      activityId: currentActivityId,
      scores,
      activityDetails: {
        slideNumber: selectedSlide,
        type: currentActivity?.type,
        name: currentActivity?.name || \`HD\${selectedSlide}\`,
        mode: currentActivity?.mode || 'GROUP',
        bonusType: currentActivity?.bonusType || 'NONE',
        bonusPoints: currentActivity?.bonusPoints || 0
      }
    });`;

uiContent = uiContent.replace(oldModalEmit, newModalEmit);
uiContent = uiContent.replace(oldGlobalEmit, newGlobalEmit);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', uiContent);

// 2. Update server.js
let serverContent = fs.readFileSync('server.js', 'utf8');

const oldConfigName = `    let historyRecord = session.activityHistory.find(h => h.name === (session.activityConfig?.name || 'HD1'));`;
const newConfigName = `    const actDetails = data.activityDetails || session.activityConfig || {};
    let historyRecord = session.activityHistory.find(h => h.name === (actDetails.name || 'HD1'));`;

const oldHistoryCreate = `      historyRecord = {
        slideNumber: session.activityConfig?.slideNumber,
        type: session.activityConfig?.type,
        name: session.activityConfig?.name,
        mode: session.activityConfig?.mode,
        bonusType: session.activityConfig?.bonusType,
        bonusPoints: session.activityConfig?.bonusPoints,
        pointsRecord: {},
        createdAt: Date.now()
      };`;
const newHistoryCreate = `      historyRecord = {
        slideNumber: actDetails.slideNumber,
        type: actDetails.type,
        name: actDetails.name || 'HD1',
        mode: actDetails.mode,
        bonusType: actDetails.bonusType,
        bonusPoints: actDetails.bonusPoints,
        pointsRecord: {},
        createdAt: Date.now()
      };`;

const oldBonusPoints = `    const bonusPoints = session.activityConfig?.bonusPoints || 0;`;
const newBonusPoints = `    const bonusPoints = (data.activityDetails ? data.activityDetails.bonusPoints : session.activityConfig?.bonusPoints) || 0;`;

serverContent = serverContent.replace(oldConfigName, newConfigName);
serverContent = serverContent.replace(oldHistoryCreate, newHistoryCreate);
serverContent = serverContent.replace(oldBonusPoints, newBonusPoints);
fs.writeFileSync('server.js', serverContent);

console.log('Fixed activityDetails in approve_group_points');
