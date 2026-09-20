const fs = require('fs');

// 1. Update server.js
let serverContent = fs.readFileSync('server.js', 'utf8');

// Add presentationType and fileUrl to sessions
serverContent = serverContent.replace(
  'validStudents: data.validStudents || [],',
  'validStudents: data.validStudents || [],\n      presentationType: data.presentationType,\n      fileUrl: data.fileUrl,'
);

// Add change_slide listener
const createSessionEnd = `    console.log(\`Session \${code} created by \${socket.id} with \${data.validStudents?.length || 0} valid students\`);
  });`;
const newChangeSlide = `    console.log(\`Session \${code} created by \${socket.id} with \${data.validStudents?.length || 0} valid students\`);
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
  });`;
if (!serverContent.includes('socket.on(\'change_slide\'')) {
  serverContent = serverContent.replace(createSessionEnd, newChangeSlide);
  fs.writeFileSync('server.js', serverContent);
}

// 2. Update Teacher UI
const teacherFile = 'src/app/teacher/presentations/[id]/page.tsx';
let teacherContent = fs.readFileSync(teacherFile, 'utf8');

const oldCreateSession = `        presentationId: presentation.id, 
        title: presentation.title,
        validStudents: classStudents 
      });`;
const newCreateSession = `        presentationId: presentation.id, 
        title: presentation.title,
        validStudents: classStudents,
        presentationType: presentation.type,
        fileUrl: presentation.fileUrl
      });`;
teacherContent = teacherContent.replace(oldCreateSession, newCreateSession);

const oldUseEffectLock = `    return () => clearTimeout(timer);
  }, [timeLeft, isLocked]);`;
const newUseEffectLock = `    return () => clearTimeout(timer);
  }, [timeLeft, isLocked]);

  useEffect(() => {
    if (socket && sessionCode && isPresenting) {
      const currentSlideData = presentation?.slides?.find((s: any) => s.slideNumber === selectedSlide);
      socket.emit('change_slide', {
        code: sessionCode,
        slideNumber: selectedSlide,
        text: currentSlideData?.text || ''
      });
    }
  }, [selectedSlide, socket, sessionCode, isPresenting, presentation]);`;
if (!teacherContent.includes('socket.emit(\'change_slide\'')) {
  teacherContent = teacherContent.replace(oldUseEffectLock, newUseEffectLock);
  fs.writeFileSync(teacherFile, teacherContent);
}

// 3. Update Student UI
const studentFile = 'src/app/student/[sessionCode]/page.tsx';
let studentContent = fs.readFileSync(studentFile, 'utf8');

const oldActivityLocked = `    newSocket.on("activity_locked", () => {
      setIsLocked(true);
    });`;
const newActivityLocked = `    newSocket.on("activity_locked", () => {
      setIsLocked(true);
    });

    newSocket.on("slide_changed", (data) => {
      setActivity({
        type: "NONE",
        slideNumber: data.slideNumber,
        presentationType: data.presentationType,
        fileUrl: data.fileUrl,
        text: data.text
      });
      setStatus("active");
    });`;
if (!studentContent.includes('newSocket.on("slide_changed"')) {
  studentContent = studentContent.replace(oldActivityLocked, newActivityLocked);
  fs.writeFileSync(studentFile, studentContent);
}

console.log('Synchronized slide changing added');
