const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
content = content.replace(
  'const [workspaceStatus, setWorkspaceStatus] = useState("WORKING");',
  'const [workspaceStatus, setWorkspaceStatus] = useState("WORKING");\n  const [isSlideCollapsed, setIsSlideCollapsed] = useState(false);'
);

// 2. Set collapse on activity start
const activityStartedRegex = /newSocket\.on\("activity_started", \(config\) => \{[\s\S]*?setActivity\(config\);[\s\S]*?setStatus\("active"\);/;
content = content.replace(activityStartedRegex, `newSocket.on("activity_started", (config) => {
      setActivity(config);
      setStatus("active");
      if (config.type === "EMBED_HTML") {
        setIsSlideCollapsed(true);
      } else {
        setIsSlideCollapsed(false);
      }`);

// 3. Update the container and slide display
const slideRegex = /<div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full flex flex-col">[\s\S]*?\{\/\* Slide Text Display \*\/\}[\s\S]*?<div className="bg-white p-2 md:p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 flex-1 min-h-\[200px\] overflow-hidden">[\s\S]*?\{activity\.fileUrl \? \([\s\S]*?<PdfViewer key=\{activity\.slideNumber\} url=\{activity\.fileUrl\} pageNumber=\{activity\.slideNumber\} \/>[\s\S]*?\) : \([\s\S]*?<div className="text-xl md:text-2xl font-medium text-black whitespace-pre-wrap font-bold leading-relaxed">[\s\S]*?\{activity\.text \|\| "Nội dung slide\.\.\."\}[\s\S]*?<\/div>[\s\S]*?\)\][\s\S]*?<\/div>/;

// Wait, the regex might be brittle. Let's use string replace.
content = content.replace(
  '<div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full flex flex-col">',
  '<div className={`flex-1 p-4 md:p-8 ${activity.type === "EMBED_HTML" ? "max-w-5xl" : "max-w-2xl"} mx-auto w-full flex flex-col`}>'
);

content = content.replace(
  '<div className="bg-white p-2 md:p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 flex-1 min-h-[200px] overflow-hidden">',
  `<div className={\`bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col overflow-hidden transition-all duration-300 \${isSlideCollapsed ? '' : 'flex-1 min-h-[200px]'}\`}>
          <div 
            className="flex justify-between items-center bg-gray-50 px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
            onClick={() => setIsSlideCollapsed(!isSlideCollapsed)}
          >
            <span className="font-semibold text-gray-700 text-sm">
              {isSlideCollapsed ? "Xem lại slide bài giảng" : "Thu gọn slide"}
            </span>
            <span className="text-gray-500">{isSlideCollapsed ? "▼" : "▲"}</span>
          </div>
          
          {!isSlideCollapsed && (
            <div className="p-2 md:p-6 flex-1 min-h-[200px] flex flex-col">`
);

// We need to close the extra div we opened (`<div className="p-2 md:p-6 flex-1 min-h-[200px]">`).
// The closing `</div>` of the slide display was:
content = content.replace(
  /\} \|\| "Nội dung slide\.\.\."\}\n\s*<\/div>\n\s*\)\}\n\s*<\/div>/,
  `} || "Nội dung slide..."}\n              </div>\n            )}\n            </div>\n          )}`
);

// 4. Update the EMBED_HTML iframe styling
const embedHtmlRegex = /\{activity\.type === "EMBED_HTML" && \(\n\s*<div className="space-y-4">\n\s*<h3 className="font-semibold text-black text-lg mb-2">Tương tác khám phá:<\/h3>\n\s*<div className="w-full h-\[60vh\] bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-inner relative">\n\s*<iframe \n\s*srcDoc=\{activity\.embedHtml[\s\S]*?className="w-full h-full border-none"\n\s*sandbox="allow-scripts allow-same-origin allow-forms allow-popups"\n\s*><\/iframe>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/;

content = content.replace(embedHtmlRegex, `{activity.type === "EMBED_HTML" && (
            <div className="flex-1 flex flex-col space-y-2 min-h-[70vh]">
              <h3 className="font-semibold text-black text-lg mb-2">Tương tác khám phá:</h3>
              <div className="w-full flex-1 bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-inner relative">
                <iframe 
                  srcDoc={activity.embedHtml || '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#888;">Không có nội dung nhúng</div>'} 
                  className="absolute inset-0 w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                ></iframe>
              </div>
            </div>
          )}`);

// Let's make sure `space-y-4` doesn't break if it was slightly different
content = content.replace(
  '<div className="w-full h-[60vh] bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-inner relative">',
  '<div className="w-full h-[75vh] md:min-h-[600px] flex-1 bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-inner relative">'
);

fs.writeFileSync(file, content);
