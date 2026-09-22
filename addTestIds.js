const fs = require('fs');

// Teacher page
let teacherCode = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');
teacherCode = teacherCode.replace(/className="flex h-screen bg-gray-50"/, 'data-testid="teacher-page" className="flex h-screen bg-gray-50"');
teacherCode = teacherCode.replace(/onClick=\{\(\) => setActivityConfigModal\(true\)\}/, 'data-testid="create-activity" onClick={() => setActivityConfigModal(true)}');
teacherCode = teacherCode.replace(/<button\s+onClick=\{startActivityForCurrentSlide\}\s*className="px-4 py-2 bg-blue-600/, '<button data-testid="save-activity" onClick={startActivityForCurrentSlide} className="px-4 py-2 bg-blue-600');
fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', teacherCode, 'utf8');

// Student page
let studentCode = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');
studentCode = studentCode.replace(/<div className="min-h-screen bg-gray-100 flex flex-col">/, '<div data-testid="student-page" className="min-h-screen bg-gray-100 flex flex-col">');
studentCode = studentCode.replace(/onClick=\{handleSubmit\}/, 'data-testid="submit-answer" onClick={handleSubmit}');
fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', studentCode, 'utf8');

// Join page
let joinCode = fs.readFileSync('src/app/join/page.tsx', 'utf8');
joinCode = joinCode.replace(/<button type="submit"/, '<button data-testid="join-session" type="submit"');
fs.writeFileSync('src/app/join/page.tsx', joinCode, 'utf8');
