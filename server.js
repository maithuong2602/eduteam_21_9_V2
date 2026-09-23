const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const next = require('next');
const scoreEngine = require('./src/lib/scoreEngine');

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
let sessions = {};
try {
    if (fs.existsSync(DB_FILE)) {
       const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
       if (db.bonusLedgers) studentBonusLedgers = db.bonusLedgers;
       if (db.activeSessions) sessions = db.activeSessions;
    }
} catch(e) { console.error(e) }

// Persist active sessions to disk periodically to survive server restarts
let lastSessionsStr = JSON.stringify(sessions);
setInterval(() => {
  try {
     const currentStr = JSON.stringify(sessions);
     if (currentStr !== lastSessionsStr) {
        lastSessionsStr = currentStr;
        let db = { classCodes: [], bonusLedgers: [], activeSessions: {} };
        if (fs.existsSync(DB_FILE)) {
           db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
        db.activeSessions = sessions;
        fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8', (err) => {
           if (err) console.error('Auto-save activeSessions error:', err);
        });
     }
  } catch(e) {}
}, 3000);

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
      console.log(`Teacher requested change_slide: ${data.slideNumber} for ${data.code}`);
    const session = sessions[data.code];
    if (session) {
        // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
        if (session.teacherSocketId !== socket.id) {
            session.teacherSocketId = socket.id;
        }
      session.currentSlide = data.slideNumber;
        session.activityConfig = null; // Clear old activity when slide changes
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
      if (session.activityConfig) {
        const primaryId = validStudent ? validStudent.systemId : data.name;
        const hasSubmitted = session.responses[session.activityConfig.slideNumber]?.[primaryId];
        const configToEmit = hasSubmitted 
          ? { ...session.activityConfig, hasSubmitted: true, submittedAnswer: hasSubmitted }
          : session.activityConfig;

        socket.emit('activity_started', configToEmit);
        if (session.activityConfig.isLocked) {
          socket.emit('activity_locked');
        }
      }
      console.log(`${realName} joined ${data.code}`);
    } else {
      socket.emit('join_error', { message: 'Mã lớp không tồn tại!' });
    }
  });

  socket.on('start_activity', (data) => {
    // data: { code, slideNumber, text, activityType, options, presentationType, fileUrl }
    const session = sessions[data.code];
    if (session) {
        // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
        if (session.teacherSocketId !== socket.id) {
            session.teacherSocketId = socket.id;
        }
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
        groups: data.groups,
        settings: data.settings,
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
      const student = session.students.find(s => s.id === socket.id);
      if (!student) return;

      const primaryId = student.systemId || student.id;

      if (!session.responses[data.slideNumber]) {
        session.responses[data.slideNumber] = {};
      }
      
      // Idempotency check: prevent duplicate submission
      if (session.responses[data.slideNumber][primaryId]) {
         return; 
      }

      session.responses[data.slideNumber][primaryId] = data.answer;
      
      // Notify teacher
      io.to(session.teacherSocketId).emit('student_answered', {
        studentId: primaryId,
        name: student.name,
        answer: data.answer,
        slideNumber: data.slideNumber
      });
    }
  });

  socket.on('request_history_payload', (data, callback) => {
    const session = sessions[data.code];
    if (!session) {
      if (callback) callback({ error: 'Session not found or unauthorized' });
      return;
    }
    
    // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
    if (session.teacherSocketId !== socket.id) {
        session.teacherSocketId = socket.id;
    }
    
    try {
      const historyPayload = {
        sessionCode: data.code,
        classId: session.classId,
        className: session.className || "Unknown",
        topicIds: [],
        lessonIds: [],
        startedAt: Date.now() - 3600000,
        completedAt: Date.now(),
        status: 'COMPLETED',
        activities: (session.activityHistory || []).map((h, i) => ({
          activityId: `ACT_${h.slideNumber}_${i}`,
          slideNumber: h.slideNumber,
          activityType: h.type,
          activityMode: h.mode,
          maxScore: 1 // Fallback
        })),
        students: (session.validStudents || []).map(s => {
          const actResults = [];
          (session.activityHistory || []).forEach((h, i) => {
            const systemId = s.systemId;
            const points = h.pointsRecord ? h.pointsRecord[systemId] : undefined;
            if (points !== undefined) {
               actResults.push({
                 activityId: `ACT_${h.slideNumber}_${i}`,
                 activityType: h.type,
                 activityMode: h.mode,
                 answer: h.responses ? (h.responses[systemId] || h.responses[s.id]) : undefined,
                 score: points,
                 maxScore: 1
               });
            }
          });
          return {
            studentId: s.systemId || s.id,
            studentName: s.name,
            sessionScore: (session.studentPoints && session.studentPoints[s.systemId]) || 0,
            activityResults: actResults
          };
        })
      };
      
      if (callback) callback({ payload: historyPayload });
    } catch (error) {
      if (callback) callback({ error: error.message });
    }
  });

  socket.on('end_session', (data, callback) => {
    const session = sessions[data.code];
    if (session) {
      // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
      if (session.teacherSocketId !== socket.id) {
          session.teacherSocketId = socket.id;
      }
      io.to(data.code).emit('session_ended');
      delete sessions[data.code];
      console.log(`Session ${data.code} ended by teacher`);
      if (typeof callback === 'function') callback({ success: true });
    } else {
      if (typeof callback === 'function') callback({ success: false });
    }
  });

  socket.on('lock_activity', (data) => {
    const session = sessions[data.code];
    if (session) {
        // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
        if (session.teacherSocketId !== socket.id) {
            session.teacherSocketId = socket.id;
        }
      if (session.activityConfig) {
        session.activityConfig.isLocked = true;
      }
      io.to(data.code).emit('activity_locked');
      console.log(`Activity locked in ${data.code}`);
    }
  });

  socket.on('unlock_activity', (data) => {
    const session = sessions[data.code];
    if (session) {
        // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
        if (session.teacherSocketId !== socket.id) {
            session.teacherSocketId = socket.id;
        }
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
    if (!session) return;
      if (session.teacherSocketId !== socket.id) session.teacherSocketId = socket.id;

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
    if (!historyRecord.breakdownRecord) historyRecord.breakdownRecord = {};
    if (!historyRecord.bonusRecord) historyRecord.bonusRecord = {};

    for (const groupId in data.activityDetails.workspaces) {
      const wsState = data.activityDetails.workspaces[groupId].state;
      const wsStatus = data.activityDetails.workspaces[groupId].status;
      if (wsStatus !== 'SUBMITTED') continue;

      const input = {
         activityType: data.activityDetails.type || 'SHORT_ANSWER',
         activityMode: 'GROUP',
         activityCategory: data.activityDetails.category || 'UNSET',
         totalCategoryActivities: data.activityDetails.totalCategoryActivities || 1,
         studentAnswer: wsState,
         activityConfig: data.activityDetails.config || {},
         bonusConfig: { hasBonus: data.activityDetails.bonusPoints > 0, maxBonusPoints: data.activityDetails.bonusPoints }
      };
      
      const result = scoreEngine.calculateActivityScore(input);
      const scoreObj = result.score;
      const breakdown = result.breakdown;
      const bonusScore = result.bonusScore;

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
            if (breakdown) {
               historyRecord.breakdownRecord[primaryId] = breakdown;
            }
            if (bonusScore) {
               historyRecord.bonusRecord[primaryId] = bonusScore;
            }
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

  socket.on('approve_points', (data, callback) => {
    const session = sessions[data.code];
    if (!session) {
      if (typeof callback === 'function') callback({ success: false });
      return;
    }
    
    if (!session.studentPoints) session.studentPoints = {};
    if (!session.activityHistory) session.activityHistory = [];

    const activityPointsRecord = {};
    const breakdownRecord = {};
    const bonusRecord = {};

    const rawResponses = data.activityDetails?.responses || {};
    const pointsMap = {};
    const typesMap = {};

    for (const [socketId, ans] of Object.entries(rawResponses)) {
      let student = session.students.find(s => String(s.systemId) === String(socketId) || String(s.id) === String(socketId));
      let systemId = student ? student.systemId : String(socketId);
      
      const validSt = session.validStudents?.find(vs => String(vs.systemId) === String(systemId) || String(vs.id) === String(systemId));
      if (validSt) systemId = validSt.systemId; // Always fallback to systemId for mapping
      
      const actualStudentId = validSt ? validSt.id : systemId;

      require('fs').appendFileSync('debug_approve.log', `[${new Date().toISOString()}] approve_points: session=${data.code} activityType=${data.activityDetails?.type} socketId=${socketId} student=${!!student} validSt=${!!validSt} systemId=${systemId} ans=${ans}\n`);

      if (student || validSt) {
        const input = {
           activityType: data.activityDetails.type || 'SHORT_ANSWER',
           activityMode: 'INDIVIDUAL',
           activityCategory: data.activityDetails.category || 'UNSET',
           totalCategoryActivities: data.activityDetails.totalCategoryActivities || 1,
           studentAnswer: ans,
           activityConfig: data.activityDetails.config || {},
           bonusConfig: { hasBonus: data.activityDetails.bonusPoints > 0, maxBonusPoints: data.activityDetails.bonusPoints }
        };

        const result = scoreEngine.calculateActivityScore(input);
        
        let points = result.score;
        let typeStr = result.isCorrect ? 'FULL' : (points > 0 ? 'PARTIAL' : 'INCORRECT');
        let bd = result.breakdown;
        let bs = result.bonusScore;

        if (data.manualOverride) {
           points = result.maxScore;
           typeStr = 'FULL';
           bd = 'Duyệt thủ công (Full)';
        }

        pointsMap[socketId] = points;
        typesMap[socketId] = typeStr;

        session.studentPoints[systemId] = (session.studentPoints[systemId] || 0) + points;
        activityPointsRecord[systemId] = points;
        if (bd) {
           breakdownRecord[systemId] = bd;
        }
        if (bs) {
           bonusRecord[systemId] = bs;
        }
        
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
       breakdownRecord,
       bonusRecord,
       responses: data.activityDetails?.responses
    });

    // Broadcast points_awarded for the animation
    io.to(data.code).emit('points_awarded', pointsMap, typesMap || {});

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
    
    if (typeof callback === 'function') callback({ success: true });
  });

  socket.on('approve_all_bonus', (data) => {
    const session = sessions[data.code];
    if (!session) return;
      if (session.teacherSocketId !== socket.id) session.teacherSocketId = socket.id;
    
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
    if (session) {
        // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
        if (session.teacherSocketId !== socket.id) {
            session.teacherSocketId = socket.id;
        }
      if (!session.groups) session.groups = [];
      session.groups.push(data.group);
      io.to(data.code).emit('group_created', session.groups);
    }
  });

  socket.on('group_member_joined', (data) => {
    // data: { code, groupId, systemId, joinedAt }
    const session = sessions[data.code];
    if (session) {
        // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
        if (session.teacherSocketId !== socket.id) {
            session.teacherSocketId = socket.id;
        }
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
    if (session) {
        // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
        if (session.teacherSocketId !== socket.id) {
            session.teacherSocketId = socket.id;
        }
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
    if (session) {
        // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
        if (session.teacherSocketId !== socket.id) {
            session.teacherSocketId = socket.id;
        }
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
    if (session) {
        // Auto-reclaim session for teacher if socket changed (e.g. after reconnect)
        if (session.teacherSocketId !== socket.id) {
            session.teacherSocketId = socket.id;
        }
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
    if (!session) return;
      if (session.teacherSocketId !== socket.id) session.teacherSocketId = socket.id;
    
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
    if (!session) return;
      if (session.teacherSocketId !== socket.id) session.teacherSocketId = socket.id;
    
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
