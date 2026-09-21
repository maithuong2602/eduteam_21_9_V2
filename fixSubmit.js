const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const regex = /const handleSubmit = \(\) => \{\s*if \(selectedAnswers\.length === 0 \|\| !socket\) return;\s*socket\.emit\("submit_answer", \{\s*code: sessionCode,\s*slideNumber: activity\.slideNumber,\s*answer: selectedAnswers\s*\}\);\s*setSubmitted\(true\);\s*\};/;

const newSubmit = `const handleSubmit = () => {
    if (!socket) return;
    
    let finalAnswer = selectedAnswers;
    if (activity.type === 'CLASSIFICATION') {
       finalAnswer = workspaceState;
       if (Object.keys(workspaceState).length === 0) return; // Must categorize at least one
    } else {
       if (selectedAnswers.length === 0) return;
    }

    socket.emit("submit_answer", {
      code: sessionCode,
      slideNumber: activity.slideNumber,
      answer: finalAnswer
    });
    setSubmitted(true);
  };`;

code = code.replace(regex, newSubmit);
fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code);
console.log('Fixed handleSubmit for CLASSIFICATION');
