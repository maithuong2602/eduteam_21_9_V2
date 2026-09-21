const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  app.use(cors());

  const path = require('path');
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  const server = http.createServer(app);
  
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

// In-memory state
// sessions = { [sessionCode]: { teacherId, presentationId, currentSlide, activity, students: [{ id, name, status, answer }] } }

const groupBonusAwards = [];
let studentBonusLedgers = [];
const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');

function saveLedger(ledger) {
  try {
    studentBonusLedgers.push(ledger);
    let db = { classCodes: [], bonusLedgers: [] };
    if (fs.existsSync(DB_FILE)) {
       db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    if (!db.bonusLedgers) db.bonusLedgers = [];
    db.bonusLedgers.push(ledger);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch(e) { console.error(e) }
}

const fs = require("fs");
try {
    if (fs.existsSync(DB_FILE)) {
       const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
       if (db.bonusLedgers) studentBonusLedgers = db.bonusLedgers;
    }
} catch(e) { console.error(e) }

const sessions = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_session', (data) => {
    // Generate or get fixed code based on classId
    const classId = data.classId;
    let code = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    if (classId) {
      const fs = require('fs');
      const path = require('path');
      const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');
      try {
        let db = { classCodes: [], bonusLedgers: [] };
        if (fs.existsSync(DB_FILE)) {
           db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
        if (!db.classCodes) db.classCodes = [];
        let cc = db.classCodes.find(c => c.classId === classId);
        if (cc) {
          code = cc.code;
        } else {
          db.classCodes.push({ classId, code });
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
        }
      } catch(e) { console.error('Error with db.json', e) }
    }
    sessions[code] = {
      teacherSocketId: socket.id,
      classId: data.classId,
      presentationId: data.presentationId,
      title: data.title,
      validStudents: data.validStudents || [],
      className: data.className || "N/A",
      presentationType: data.presentationType,
      fileUrl: data.fileUrl,
      students: [],
      currentSlide: 1,
      activityConfig: null,
      responses: {}
    };
    socket.join(code);
    socket.emit('session_created', { code });
    console.log(`Session ${code} created by ${socket.id} with ${data.validStudents?.length || 0} valid students`);
  });

  socket.on('change_slide', (data) => {
    const session = sessions[data.code];
    if (session && session.teacherSocketId === socket.id) {
      session.currentSlide = data.slideNumber;
      io.to(data.code).emit('slide_changed', {
        slideNumber: data.slideNumber,
        presentationType: session.presentationType || 'pptx',
        fileUrl: session.fileUrl,
        text: data.text || ''
      });
    }
  });

  socket.on('join_session', (data) => {
    // data: { code, name } (name is actually student systemId like HS123)
    const session = sessions[data.code];
    if (session) {
      // Validate student ID
      const inputId = String(data.name).trim();
      const validStudent = session.validStudents.find(s => 
        String(s.systemId).trim() === inputId || String(s.id).trim() === inputId
      );
      
      if (!validStudent) {
        socket.emit('join_error', { message: 'Mã học sinh không thuộc lớp này!' });
        return;
      }

      const realName = validStudent ? validStudent.name : data.name;
      const systemId = validStudent ? validStudent.systemId : data.name;

      const existingStudent = session.students.find(s => s.systemId === systemId);
      if (existingStudent) {
        existingStudent.id = socket.id;
        existingStudent.status = 'ONLINE';
      } else {
        session.students.push({ id: socket.id, systemId, name: realName, status: 'ONLINE' });
      }
      socket.join(data.code);
      
      // Notify teacher
      io.to(session.teacherSocketId).emit('student_joined', session.students);
      
      // Confirm to student
      socket.emit('join_success', { code: data.code, realName });
      if (session.groups) socket.emit('groups_updated', session.groups);
      
      // Send current activity to student if active
      if (session.activityConfig && !session.activityConfig.isLocked) {
        socket.emit('activity_started', session.activityConfig);
      } else if (session.activityConfig && session.activityConfig.isLocked) {
        socket.emit('activity_started', session.activityConfig);
        socket.emit('activity_locked');
      }
      console.log(`${realName} joined ${data.code}`);
    } else {
      socket.emit('join_error', { message: 'Mã lớp không tồn tại!' });
    }
  });

  socket.on('start_activity', (data) => {
    // data: { code, slideNumber, text, activityType, options, presentationType, fileUrl }
    const session = sessions[data.code];
    if (session && session.teacherSocketId === socket.id) {
      session.currentSlide = data.slideNumber;
      session.activityConfig = {
        slideNumber: data.slideNumber,
        activityId: data.activityId,
        text: data.text,
        type: data.activityType,
        name: data.name || `HD${data.slideNumber}`,
        mode: data.mode || 'INDIVIDUAL',
        points: data.points || 1,
        bonusType: data.bonusType || 'NONE',
        bonusPoints: data.bonusPoints || 0,
        endTime: data.endTime || null,
        options: data.options,
        items: data.items,
        categories: data.categories,
        presentationType: data.presentationType,
        fileUrl: data.fileUrl
      };
      // Reset responses for this activity
      session.responses[data.slideNumber] = {};
      
      // Broadcast to students
      io.to(data.code).emit('activity_started', session.activityConfig);
      console.log(`Activity started in ${data.code} on slide ${data.slideNumber}`);
    }
  });

  socket.on('submit_answer', (data) => {
    // data: { code, slideNumber, answer }
    const session = sessions[data.code];
    if (session && !session.activityConfig?.isLocked) {
      if (!session.responses[data.slideNumber]) {
        session.responses[data.slideNumber] = {};
      }
      session.responses[data.slideNumber][socket.id] = data.answer;
      
      // Notify teacher
      const student = session.students.find(s => s.id === socket.id);
      if (student) {
        io.to(session.teacherSocketId).emit('student_answered', {
          studentId: socket.id,
          name: student.name,
          answer: data.answer,
          slideNumber: data.slideNumber
        });
      }
    }
  });

  socket.on('lock_activity', (data) => {
    const session = sessions[data.code];
    if (session && session.teacherSocketId === socket.id) {
      if (session.activityConfig) {
        session.activityConfig.isLocked = true;
      }
      io.to(data.code).emit('activity_locked');
      console.log(`Activity locked in ${data.code}`);
    }
  });

  socket.on('unlock_activity', (data) => {
    const session = sessions[data.code];
    if (session && session.teacherSocketId === socket.id) {
      if (session.activityConfig) {
        session.activityConfig.isLocked = false;
      }
      io.to(data.code).emit('activity_unlocked');
      console.log(`Activity unlocked in ${data.code}`);
    }
  });

  
  socket.on('approve_group_points', (data) => {
    // data: { code, activityId, scores: { [groupId]: score } }
    const session = sessions[data.code];
    if (!session || session.teacherSocketId !== socket.id) return;

    const activityId = data.activityId;
    const bonusPoints = (data.activityDetails ? data.activityDetails.bonusPoints : session.activityConfig?.bonusPoints) || 0;
    const pointsAwarded = {};

    // Find or create activityHistory for this group activity
    if (!session.activityHistory) session.activityHistory = [];
    const actDetails = data.activityDetails || session.activityConfig || {};
    let historyRecord = session.activityHistory.find(h => h.name === (actDetails.name || 'HD1'));
    if (!historyRecord) {
      historyRecord = {
        slideNumber: actDetails.slideNumber,
        type: actDetails.type,
        name: actDetails.name || 'HD1',
        mode: actDetails.mode,
        bonusType: actDetails.bonusType,
        bonusPoints: actDetails.bonusPoints,
        pointsRecord: {},
        createdAt: Date.now()
      };
      session.activityHistory.push(historyRecord);
    }
    if (!historyRecord.pointsRecord) historyRecord.pointsRecord = {};

    for (const groupId in data.scores) {
      const scoreObj = data.scores[groupId];
      const ws = session.workspaces?.[activityId]?.[groupId];
      if (ws) {
        ws.groupScore = scoreObj; // Save GroupScore
      }

      const group = session.groups?.find(g => g.id === groupId);
      if (!group || !group.members || group.members.length === 0) continue;

      const validMembers = data.approvedMembers && data.approvedMembers[groupId] ? group.members.filter(m => data.approvedMembers[groupId].includes(m.studentId)) : group.members;

      // 1. Award regular ACTIVITY_SCORE
      validMembers.forEach(m => {
        const studentId = m.studentId;
        const validSt = session.validStudents.find(vs => String(vs.id) === String(studentId));
        const primaryId = validSt ? validSt.systemId : studentId;

        // Prevent double counting if teacher clicks Duyệt multiple times for the same group
        if (historyRecord.pointsRecord[primaryId] === undefined) {
           historyRecord.pointsRecord[primaryId] = scoreObj;
           if (!session.studentPoints) session.studentPoints = {};
           session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) + scoreObj;
             
             saveLedger({
               ledgerId: 'LED_' + Date.now() + '_' + (validSt ? validSt.id : studentId),
               studentId: (validSt ? validSt.id : studentId),
               sessionCode: data.code,
               classId: session.classId,
               activityId: activityId,
               points: scoreObj,
               reason: 'ACTIVITY_SCORE',
               groupId: groupId,
               createdAt: Date.now()
             });

           const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === studentId);
           if (onlineStudent) {
             pointsAwarded[onlineStudent.id] = (pointsAwarded[onlineStudent.id] || 0) + scoreObj; 
           }
           pointsAwarded[studentId] = (pointsAwarded[studentId] || 0) + scoreObj; 
           pointsAwarded[primaryId] = (pointsAwarded[primaryId] || 0) + scoreObj; 
        }
      });

      // 2. Award GROUP_BONUS if applicable
      const alreadyAwarded = groupBonusAwards.find(a => 
         a.sessionCode === data.code && a.activityId === activityId && a.groupId === groupId
      );

      if (!alreadyAwarded && bonusPoints > 0) {
        const awardId = 'AWD_' + Date.now() + '_' + groupId;
        groupBonusAwards.push({
          awardId, sessionCode: data.code,
      classId: session.classId, activityId, groupId, bonusPoints, appliedAt: Date.now()
        });

        validMembers.forEach(m => {
          const studentId = m.studentId;
          const validSt = session.validStudents.find(vs => String(vs.id) === String(studentId));
          const primaryId = validSt ? validSt.systemId : studentId;

          saveLedger({
            ledgerId: 'LED_' + Date.now() + '_' + studentId,
            studentId,
            sessionCode: data.code,
      classId: session.classId,
            activityId,
            points: bonusPoints,
            reason: 'GROUP_BONUS',
            groupId: groupId,
            createdAt: Date.now()
          });

          if (!session.studentPoints) session.studentPoints = {};
          session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) + bonusPoints;
          
          const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === studentId);
          if (onlineStudent) {
            pointsAwarded[onlineStudent.id] = (pointsAwarded[onlineStudent.id] || 0) + bonusPoints; 
          }
          pointsAwarded[studentId] = (pointsAwarded[studentId] || 0) + bonusPoints; 
          pointsAwarded[primaryId] = (pointsAwarded[primaryId] || 0) + bonusPoints; 
        });
        
        io.to(data.code).emit('group_bonus_awarded', { groupId, activityId, bonusPoints });
      }
    }

    if (Object.keys(pointsAwarded).length > 0) {
      io.to(data.code).emit('points_awarded', pointsAwarded);
      const leaderboard = Object.entries(session.studentPoints).map(([systemId, total]) => {
         const st = session.validStudents.find(vs => String(vs.systemId) === String(systemId));
         return { systemId, name: st ? st.name : systemId, total };
      }).sort((a, b) => (b.total - a.total));
      io.to(data.code).emit('leaderboard_updated', leaderboard);
    }
  });

  socket.on('approve_points', (data) => {
    const session = sessions[data.code];
    if (!session) return;
    
    if (!session.studentPoints) session.studentPoints = {};
    if (!session.activityHistory) session.activityHistory = [];

    const activityPointsRecord = {};

    for (const [socketId, points] of Object.entries(data.pointsMap)) {
      const student = session.students.find(s => s.id === socketId);
      if (student) {
        const systemId = student.systemId;
        const validSt = session.validStudents?.find(vs => String(vs.systemId) === String(systemId));
        const actualStudentId = validSt ? validSt.id : systemId;
        
        session.studentPoints[systemId] = (session.studentPoints[systemId] || 0) + points;
        activityPointsRecord[systemId] = points;
        
        saveLedger({
          ledgerId: 'LED_' + Date.now() + '_' + actualStudentId,
          studentId: actualStudentId,
          sessionCode: data.code,
          classId: session.classId,
          activityId: 'ACTIVITY_SCORE',
          points: points,
          reason: 'ACTIVITY_SCORE',
          groupId: null,
          createdAt: Date.now()
        });
      }
    }

    session.activityHistory.push({
       slideNumber: data.activityDetails?.slideNumber,
       type: data.activityDetails?.type,
       name: data.activityDetails?.name,
       mode: data.activityDetails?.mode,
       bonusType: data.activityDetails?.bonusType,
       bonusPoints: data.activityDetails?.bonusPoints,
       date: data.activityDetails?.date,
       pointsRecord: activityPointsRecord,
       responses: data.activityDetails?.responses
    });

    // Broadcast points_awarded for the animation
    io.to(data.code).emit('points_awarded', data.pointsMap, data.typesMap || {});

    // Calculate leaderboard
    const leaderboard = Object.entries(session.studentPoints).map(([systemId, total]) => {
      const studentInfo = session.validStudents.find(s => String(s.systemId).trim() === String(systemId).trim());
      return {
        systemId,
        name: studentInfo ? studentInfo.name : 'Unknown',
        total
      };
    }).sort((a, b) => b.total - a.total);

    io.to(data.code).emit('leaderboard_updated', leaderboard);
    io.to(session.teacherSocketId).emit('history_updated', session.activityHistory);

    if (session.bonusRequests) {
      session.bonusRequests = session.bonusRequests.filter(id => id !== data.studentId);
      io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);
    }
  });

  socket.on('approve_all_bonus', (data) => {
    const session = sessions[data.code];
    if (!session || session.teacherSocketId !== socket.id) return;
    
    if (!session.bonusRequests) return;
    const bonusPoints = 1;
    
    if (!session.studentPoints) session.studentPoints = {};
    const pointsAwarded = {};
    
    session.bonusRequests.forEach(studentId => {
      const validSt = session.validStudents?.find(vs => String(vs.id) === String(studentId) || String(vs.systemId) === String(studentId));
      const primaryId = validSt ? validSt.systemId : studentId;
      const actualStudentId = validSt ? validSt.id : studentId;

      session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) + bonusPoints;
      
      saveLedger({
        ledgerId: 'LED_' + Date.now() + '_' + actualStudentId,
        studentId: actualStudentId,
        sessionCode: data.code,
      classId: session.classId,
        activityId: 'HAND_RAISE',
        points: bonusPoints,
        reason: 'INDIVIDUAL_BONUS',
        groupId: null,
        createdAt: Date.now()
      });

      const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === actualStudentId);
      if (onlineStudent) {
        pointsAwarded[onlineStudent.id] = bonusPoints;
      }
      pointsAwarded[actualStudentId] = bonusPoints;
      pointsAwarded[primaryId] = bonusPoints;
    });

    // Send one big points_awarded payload!
    io.to(data.code).emit('points_awarded', pointsAwarded, {});

    const leaderboard = Object.entries(session.studentPoints).map(([sysId, total]) => {
       const st = session.validStudents.find(vs => String(vs.systemId) === String(sysId));
       return { systemId: sysId, name: st ? st.name : sysId, total };
    }).sort((a, b) => (b.total - a.total));
    io.to(data.code).emit('leaderboard_updated', leaderboard);

    session.bonusRequests = [];
    io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);
  });

  socket.on('create_group', (data) => {
    const session = sessions[data.code];
    if (session && session.teacherSocketId === socket.id) {
      if (!session.groups) session.groups = [];
      session.groups.push(data.group);
      io.to(data.code).emit('group_created', session.groups);
    }
  });

  socket.on('group_member_joined', (data) => {
    // data: { code, groupId, systemId, joinedAt }
    const session = sessions[data.code];
    if (session && session.teacherSocketId === socket.id) {
      if (!session.groups) session.groups = [];
      // Remove from old groups first
      session.groups.forEach(g => {
        if (g.members) g.members = g.members.filter(m => m.studentId !== data.systemId);
      });
      const group = session.groups.find(g => g.id === data.groupId);
      if (group) {
        if (!group.members) group.members = [];
        group.members.push({ studentId: data.systemId, joinedAt: data.joinedAt || Date.now() });
      }
      io.to(data.code).emit('group_member_joined', session.groups);
    }
  });

  socket.on('group_member_left', (data) => {
    const session = sessions[data.code];
    if (session && session.teacherSocketId === socket.id) {
      if (!session.groups) session.groups = [];
      session.groups.forEach(g => {
        if (g.members) g.members = g.members.filter(m => m.studentId !== data.systemId);
      });
      io.to(data.code).emit('group_member_left', session.groups);
    }
  });

  // For bulk sync (Teacher -> Server -> Student)
  socket.on('sync_groups', (data) => {
    const session = sessions[data.code];
    if (session && session.teacherSocketId === socket.id) {
      session.groups = data.groups;
      io.to(data.code).emit('groups_updated', session.groups);
    }
  });

  // Workspace logic
  socket.on('group_workspace_update', (data) => {
    const session = sessions[data.code];
    if (!session || session.activityConfig?.isLocked) return;
    
    if (!session.workspaces) session.workspaces = {};
    if (!session.workspaces[data.activityId]) session.workspaces[data.activityId] = {};
    
    let ws = session.workspaces[data.activityId][data.groupId];
    
    // Check if already submitted
    if (ws && ws.status === 'SUBMITTED') return;

    if (!ws) {
      ws = {
        sessionCode: data.code,
      classId: session.classId,
        activityId: data.activityId,
        groupId: data.groupId,
        state: data.state,
        version: data.version || 1,
        lastUpdatedAt: Date.now(),
        status: 'WORKING'
      };
      session.workspaces[data.activityId][data.groupId] = ws;
    } else {
      // Validate version
      if (data.version > ws.version) {
        ws.state = data.state;
        ws.version = data.version;
        ws.lastUpdatedAt = Date.now();
      } else {
        socket.emit('workspace_sync', ws);
        return;
      }
    }
    
    // Broadcast to room
    io.to(data.code).emit('workspace_sync', ws);
  });

  socket.on('group_presence_update', (data) => {
    // data: { code, activityId, groupId, studentId, status }
    const session = sessions[data.code];
    if (session && session.workspaces && session.workspaces[data.activityId]) {
      const ws = session.workspaces[data.activityId][data.groupId];
      if (ws) {
        if (!ws.presence) ws.presence = {};
        ws.presence[data.studentId] = data.status;
        io.to(data.code).emit('workspace_sync', ws);
      }
    }
  });

  socket.on('group_submit', (data) => {
    // data: { code, activityId, groupId, answer }
    const session = sessions[data.code];
    if (!session || session.activityConfig?.isLocked) return;
    
    if (!session.workspaces) session.workspaces = {};
    if (!session.workspaces[data.activityId]) session.workspaces[data.activityId] = {};
    
    let ws = session.workspaces[data.activityId][data.groupId];
    
    if (!ws) {
      ws = {
        sessionCode: data.code,
      classId: session.classId,
        activityId: data.activityId,
        groupId: data.groupId,
        state: data.answer || {},
        version: 1,
        lastUpdatedAt: Date.now()
      };
      session.workspaces[data.activityId][data.groupId] = ws;
    } else if (data.answer) {
      ws.state = data.answer; // for MC/WordCloud overriding
      ws.version++;
      ws.lastUpdatedAt = Date.now();
    }
    
    if (ws.status !== 'SUBMITTED') {
      ws.status = 'SUBMITTED';
      ws.submittedAt = Date.now();
      io.to(data.code).emit('workspace_sync', ws);
      io.to(data.code).emit('group_submitted', { groupId: data.groupId, status: 'SUBMITTED' });
    }
  });

  socket.on('request_workspace_sync', (data) => {
    const session = sessions[data.code];
    if (session && session.workspaces && session.workspaces[data.activityId]) {
      const ws = session.workspaces[data.activityId][data.groupId];
      if (ws) {
        socket.emit('workspace_sync', ws);
      }
    }
  });

  socket.on('request_export_ledgers', (data) => {
    const session = sessions[data.code];
    if (session && session.teacherSocketId === socket.id) {
       const ledgers = studentBonusLedgers.filter(l => l.sessionCode === data.code);
       socket.emit('export_ledgers_ready', {
          ledgers,
          history: session.activityHistory || [],
          studentPoints: session.studentPoints || {},
          validStudents: session.validStudents || [],
          className: session.className || "N/A",
          groups: session.groups || []
       });
    }
  });


  socket.on('request_bonus', (data) => {
    const session = sessions[data.code];
    if (session) {
       if (!session.bonusRequests) session.bonusRequests = [];
       if (!session.bonusRequests.includes(data.studentId)) {
          session.bonusRequests.push(data.studentId);
       }
       io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);
    }
  });


  socket.on('cancel_bonus_request', (data) => {
    const session = sessions[data.code];
    if (!session) return;
    
    if (session.bonusRequests) {
      session.bonusRequests = session.bonusRequests.filter(id => id !== data.studentId);
      io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);
    }
    
    if (!session.cancelHandRaiseCount) session.cancelHandRaiseCount = {};
    session.cancelHandRaiseCount[data.studentId] = (session.cancelHandRaiseCount[data.studentId] || 0) + 1;
    
    if (session.cancelHandRaiseCount[data.studentId] % 2 === 0) {
      const validSt = session.validStudents?.find(vs => String(vs.id) === String(data.studentId) || String(vs.systemId) === String(data.studentId));
      const primaryId = validSt ? validSt.systemId : data.studentId;
      const actualStudentId = validSt ? validSt.id : data.studentId;
      
      if (!session.studentPoints) session.studentPoints = {};
      session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) - 1;
      
      const pointsAwarded = {};
      const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === actualStudentId);
      if (onlineStudent) pointsAwarded[onlineStudent.id] = -1;
      pointsAwarded[actualStudentId] = -1;
      pointsAwarded[primaryId] = -1;
      
      const typesMap = {};
      Object.keys(pointsAwarded).forEach(k => typesMap[k] = 'PENALTY');
      
      io.to(data.code).emit('points_awarded', pointsAwarded, typesMap);
      
      const leaderboard = Object.entries(session.studentPoints).map(([sysId, total]) => {
         const st = session.validStudents.find(vs => String(vs.systemId) === String(sysId));
         return { systemId: sysId, name: st ? st.name : sysId, total };
      }).sort((a, b) => (b.total - a.total));
      io.to(data.code).emit('leaderboard_updated', leaderboard);
    }
  });


  socket.on('reject_bonus_request', (data) => {
    const session = sessions[data.code];
    if (!session || session.teacherSocketId !== socket.id) return;
    
    if (session.bonusRequests) {
      session.bonusRequests = session.bonusRequests.filter(id => id !== data.studentId);
      io.to(data.code).emit('bonus_requests_updated', session.bonusRequests);
    }
    
    if (!session.teacherRejectCount) session.teacherRejectCount = {};
    session.teacherRejectCount[data.studentId] = (session.teacherRejectCount[data.studentId] || 0) + 1;
    
    if (session.teacherRejectCount[data.studentId] > 0 && session.teacherRejectCount[data.studentId] % 2 === 0) {
      const validSt = session.validStudents?.find(vs => String(vs.id) === String(data.studentId) || String(vs.systemId) === String(data.studentId));
      const primaryId = validSt ? validSt.systemId : data.studentId;
      const actualStudentId = validSt ? validSt.id : data.studentId;
      
      if (!session.studentPoints) session.studentPoints = {};
      session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) - 1;
      
      const pointsAwarded = {};
      const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === actualStudentId);
      if (onlineStudent) pointsAwarded[onlineStudent.id] = -1;
      pointsAwarded[actualStudentId] = -1;
      pointsAwarded[primaryId] = -1;
      
      const typesMap = {};
      Object.keys(pointsAwarded).forEach(k => typesMap[k] = 'TEACHER_REJECT_PENALTY');
      
      io.to(data.code).emit('points_awarded', pointsAwarded, typesMap);
      
      const leaderboard = Object.entries(session.studentPoints).map(([sysId, total]) => {
         const st = session.validStudents.find(vs => String(vs.systemId) === String(sysId));
         return { systemId: sysId, name: st ? st.name : sysId, total };
      }).sort((a, b) => (b.total - a.total));
      io.to(data.code).emit('leaderboard_updated', leaderboard);
    }
  });

  socket.on('approve_individual_bonus', (data) => {
    // data: { code, studentId, points }
    const session = sessions[data.code];
    if (!session || session.teacherSocketId !== socket.id) return;
    
    const studentId = data.studentId;
    const bonusPoints = data.points || 1;
    
    const validSt = session.validStudents?.find(vs => String(vs.id) === String(studentId) || String(vs.systemId) === String(studentId));
    const primaryId = validSt ? validSt.systemId : studentId;
    const actualStudentId = validSt ? validSt.id : studentId;

    if (!session.studentPoints) session.studentPoints = {};
    session.studentPoints[primaryId] = (session.studentPoints[primaryId] || 0) + bonusPoints;
    
    saveLedger({
      ledgerId: 'LED_' + Date.now() + '_' + actualStudentId,
      studentId: actualStudentId,
      sessionCode: data.code,
      classId: session.classId,
      activityId: 'HAND_RAISE',
      points: bonusPoints,
      reason: 'INDIVIDUAL_BONUS',
      groupId: null,
      createdAt: Date.now()
    });

    const pointsAwarded = {};
    const onlineStudent = session.students.find(s => s.systemId === primaryId || s.id === actualStudentId);
    if (onlineStudent) {
      pointsAwarded[onlineStudent.id] = bonusPoints;
    }
    pointsAwarded[actualStudentId] = bonusPoints;
    pointsAwarded[primaryId] = bonusPoints;

    io.to(data.code).emit('points_awarded', pointsAwarded);
    
    const leaderboard = Object.entries(session.studentPoints).map(([sysId, total]) => {
       const st = session.validStudents.find(vs => String(vs.systemId) === String(sysId));
       return { systemId: sysId, name: st ? st.name : sysId, total };
    }).sort((a, b) => (b.total - a.total));
    io.to(data.code).emit('leaderboard_updated', leaderboard);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const code in sessions) {
      const session = sessions[code];
      const student = session.students.find(s => s.id === socket.id);
      if (student) {
        student.status = 'OFFLINE';
        io.to(session.teacherSocketId).emit('student_joined', session.students);
      }
    }
  });
});

  app.use((req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT} (Next.js + Socket.io Unified)`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
