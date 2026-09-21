const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

code = code.replace(
  /<PdfViewer url=\{activity\.fileUrl\} pageNumber=\{activity\.slideNumber\} \/>/g,
  '<PdfViewer key={activity.slideNumber} url={activity.fileUrl} pageNumber={activity.slideNumber} />'
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code);
console.log('Added key to PdfViewer');
