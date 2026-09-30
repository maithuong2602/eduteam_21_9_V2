const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const target = `            session.studentPoints[memSystemId] = scoreEngine.cleanScore((session.studentPoints[memSystemId] || 0) + points);
            activityPointsRecord[memSystemId] = points;`;

const replacement = `            // Also notify them so they see the animation
            pointsMap[memActualId] = points;
            pointsMap[memSystemId] = points;
            typesMap[memActualId] = typeStr;
            typesMap[memSystemId] = typeStr;

            session.studentPoints[memSystemId] = scoreEngine.cleanScore((session.studentPoints[memSystemId] || 0) + points);
            activityPointsRecord[memSystemId] = points;`;

const targetNormalized = target.replace(/\r\n/g, '\n');
const contentNormalized = content.replace(/\r\n/g, '\n');

if (contentNormalized.includes(targetNormalized)) {
    content = contentNormalized.replace(targetNormalized, replacement);
    fs.writeFileSync('server.js', content);
    console.log('Replaced successfully');
} else {
    console.log('Target not found!');
}
