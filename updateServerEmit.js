const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const oldApprovePointsEmit = `io.to(data.code).emit('points_awarded', data.pointsMap);`;
const newApprovePointsEmit = `io.to(data.code).emit('points_awarded', data.pointsMap, data.typesMap || {});`;
content = content.replace(oldApprovePointsEmit, newApprovePointsEmit);

fs.writeFileSync('server.js', content);
console.log('Updated approve_points emit');
