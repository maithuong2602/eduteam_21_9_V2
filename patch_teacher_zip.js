const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the FILE_UPLOAD card render logic to parse JSON and show metadata
const oldRender = `{currentActivity?.type === 'FILE_UPLOAD' && typeof ans === 'string' && ans.startsWith('http') ? (
                                <a href={ans} target="_blank" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 underline">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                  <span>Tải xuống/Xem bài</span>
                                </a>
                              ) : (
                                ansText
                              )}`;

const newRender = `{currentActivity?.type === 'FILE_UPLOAD' && typeof ans === 'string' ? (
                                (() => {
                                  try {
                                    const meta = JSON.parse(ans);
                                    if (meta && meta.url) {
                                      const kb = Math.round((meta.size || 0) / 1024);
                                      const timeStr = new Date(meta.timestamp).toLocaleTimeString('vi-VN');
                                      return (
                                        <div className="flex flex-col space-y-1">
                                          <a href={meta.url} target="_blank" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 underline font-semibold">
                                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                            <span className="truncate" title={meta.filename}>{meta.filename || "Tải xuống"}</span>
                                          </a>
                                          <div className="text-xs text-gray-500 font-normal">
                                            {kb} KB • Nộp lúc: {timeStr}
                                          </div>
                                        </div>
                                      );
                                    }
                                  } catch(e) {}
                                  return (
                                    <a href={ans} target="_blank" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 underline">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                      <span>Tải xuống/Xem bài</span>
                                    </a>
                                  )
                                })()
                              ) : (
                                ansText
                              )}`;

content = content.replace(oldRender, newRender);

// Add download ZIP button
const oldTitle = `<h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Danh sách chi tiết 
({currentActivity?.mode === 'GROUP' ? Object.keys(workspaces).length : Object.keys(responses).length} phản 
hồi)</h3>`;

const newTitle = `<div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        Danh sách chi tiết ({currentActivity?.mode === 'GROUP' ? Object.keys(workspaces).length : Object.keys(responses).length} phản hồi)
                      </h3>
                      {currentActivity?.type === 'FILE_UPLOAD' && (
                        <a 
                          href={\`/api/download_submissions/\${sessionCode}/\${currentActivity?.activityId || currentActivity?.slideNumber}\`} 
                          download
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 text-sm transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          <span>Tải toàn bộ (.zip)</span>
                        </a>
                      )}
                    </div>`;

content = content.replace(oldTitle.replace(/\r\n/g, '\n'), newTitle);

// Fallback replace if whitespace mismatch
if (!content.includes('download_submissions')) {
    content = content.replace(
        /<h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">[\s\S]*?<\/h3>/,
        newTitle
    );
}

fs.writeFileSync(file, content);
console.log('Success - patched teacher page');
