const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will look for:
const target = `          {!isSlideCollapsed && (
            <div className="p-2 md:p-6 flex-1 min-h-[200px] flex flex-col">
          {activity.fileUrl ? (
            <PdfViewer key={activity.slideNumber} url={activity.fileUrl} pageNumber={activity.slideNumber} />
          ) : (
            <div className="text-xl md:text-2xl font-medium text-black whitespace-pre-wrap font-bold leading-relaxed">
              {activity.text || "Nội dung slide..."}
            </div>
          )}
        </div>`;

const target2 = target.replace("Nội dung slide...", "NTi dung slide..."); // Fallback if encoding issues

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

if (content.includes(target)) {
  content = content.replace(target, replacement);
  console.log('Replaced with target1');
} else if (content.includes(target2)) {
  content = content.replace(target2, replacement);
  console.log('Replaced with target2');
} else {
  // Use a more relaxed regex
  const regex = /\{\!isSlideCollapsed && \([\s\S]*?<div className="p-2 md:p-6 flex-1 min-h-\[200px\] flex flex-col">[\s\S]*?\{activity\.fileUrl \? \([\s\S]*?<PdfViewer key=\{activity\.slideNumber\} url=\{activity\.fileUrl\} pageNumber=\{activity\.slideNumber\} \/>[\s\S]*?\) : \([\s\S]*?<div className="text-xl md:text-2xl font-medium text-black whitespace-pre-wrap font-bold leading-relaxed">[\s\S]*?\{activity\.text \|\| "[^"]+"\}[\s\S]*?<\/div>[\s\S]*?\)\}[\s\S]*?<\/div>/;
  if (regex.test(content)) {
      content = content.replace(regex, replacement);
      console.log('Replaced with regex');
  } else {
      console.log('Target not found at all');
  }
}

fs.writeFileSync(file, content);
