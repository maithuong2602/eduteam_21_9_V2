const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /          \{\!isSlideCollapsed && \(\n            <div className="p-2 md:p-6 flex-1 min-h-\[200px\] flex flex-col">\n          \{activity\.fileUrl \? \(\n            <PdfViewer key=\{activity\.slideNumber\} url=\{activity\.fileUrl\} pageNumber=\{activity\.slideNumber\} \/>\n          \) : \(\n            <div className="text-xl md:text-2xl font-medium text-black whitespace-pre-wrap font-bold leading-relaxed">\n              \{activity\.text \|\| "Nội dung slide\.\.\."\}\n            <\/div>\n          \)\}\n        <\/div>/;

const replacement = `          {!isSlideCollapsed && (
            <div className="p-2 md:p-6 flex-1 min-h-[200px] flex flex-col">
              {activity.fileUrl ? (
                <PdfViewer key={activity.slideNumber} url={activity.fileUrl} pageNumber={activity.slideNumber} />
              ) : (
                <div className="text-xl md:text-2xl font-medium text-black whitespace-pre-wrap font-bold leading-relaxed">
                  {activity.text || "Nội dung slide..."}
                </div>
              )}
            </div>
          )}
        </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
