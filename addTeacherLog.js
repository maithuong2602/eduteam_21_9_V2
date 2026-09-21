const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

code = code.replace(
  /socket\.emit\('change_slide', \{[\s\S]*?\}\);/g,
  `console.log("Emitting change_slide", selectedSlide);
        socket.emit('change_slide', {
          code: sessionCode,
          slideNumber: selectedSlide,
          text: currentSlideData?.text || ''
        });`
);
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Added log to teacher change_slide emit');
