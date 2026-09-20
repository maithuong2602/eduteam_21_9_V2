const fs = require('fs');
let content = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const oldGroupBonus = `    newSocket.on("group_bonus_awarded", (data) => {
      // Find out if I am in this group by checking groupInfo
      setGroupInfo((prev: any) => {
        if (prev && prev.id === data.groupId && data.bonusPoints > 0) {
          setTrophy({ show: true, points: data.bonusPoints, label: "điểm nhóm" });
          setTimeout(() => {
            setTrophy({ show: false, points: 0, label: "" });
          }, 5000);
        }
        return prev;
      });
    });

    newSocket.on("points_awarded", (pointsMap) => {
      const socketId = newSocket.id;
      const myPoints = socketId ? pointsMap[socketId] : 0;
      if (myPoints > 0) {
        setTrophy({ show: true, points: myPoints });
        setTimeout(() => {
          setTrophy({ show: false, points: 0 });
        }, 5000); // Hide after 5 seconds
      }
    });`;

const newGroupBonus = `    newSocket.on("group_bonus_awarded", (data) => {
      // Handled by points_awarded now
    });

    newSocket.on("points_awarded", (pointsMap) => {
      const socketId = newSocket.id;
      // myId can be the entered student ID, which might be in pointsMap for group bonuses
      const myId = name;
      const myPoints = (socketId && pointsMap[socketId]) || (myId && pointsMap[myId]) || 0;
      if (myPoints > 0) {
        setTrophy({ show: true, points: myPoints });
        setTimeout(() => {
          setTrophy({ show: false, points: 0 });
        }, 5000);
      }
    });`;

content = content.replace(oldGroupBonus, newGroupBonus);
fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', content);
console.log('Fixed points_awarded animation in Student UI');
