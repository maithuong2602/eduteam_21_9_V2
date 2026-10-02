const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the sorting logic
const oldIter = `{(currentActivity?.mode === 'GROUP' ? Object.values(workspaces).map(ws => [ws.groupId, ws.state]) : Object.entries(responses)).map(([id, ans], index) => {`;
const newIter = `{(currentActivity?.mode === 'GROUP' ? Object.values(workspaces).map(ws => [ws.groupId, ws.state]) : Object.entries(responses).sort((a, b) => {
                          if (currentActivity?.type !== 'FILE_UPLOAD') return 0;
                          try {
                            const metaA = JSON.parse(Array.isArray(a[1]) ? (a[1][0] || '{}') : (a[1] || '{}'));
                            const metaB = JSON.parse(Array.isArray(b[1]) ? (b[1][0] || '{}') : (b[1] || '{}'));
                            return (metaA.timestamp || 0) - (metaB.timestamp || 0);
                          } catch(e) { return 0; }
                        })).map(([id, ans], index) => {`;
if (content.includes(oldIter)) {
  content = content.replace(oldIter, newIter);
}

// Replace the rendering logic inside the padlet
const oldPadlet = `<div className="text-gray-900 whitespace-pre-wrap break-words break-all text-[15px] font-medium leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar pr-1">{ansText}</div>`;
const newPadlet = `<div className="text-gray-900 whitespace-pre-wrap break-words break-all text-[15px] font-medium leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                {currentActivity?.type === 'FILE_UPLOAD' ? (
                                  (() => {
                                    try {
                                      const meta = JSON.parse(Array.isArray(ans) ? ans[0] : ans);
                                      if (meta && meta.url) {
                                        const kb = Math.round((meta.size || 0) / 1024);
                                        const timeStr = new Date(meta.timestamp).toLocaleTimeString('vi-VN');
                                        return (
                                          <div className="flex flex-col space-y-2">
                                            <a href={meta.url} target="_blank" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 underline font-semibold">
                                              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                              <span className="truncate" title={meta.filename}>{meta.filename || "Tải xuống"}</span>
                                            </a>
                                            <div className="text-xs text-gray-500 font-normal border-b pb-2">
                                              {kb} KB • Nộp lúc: {timeStr}
                                            </div>
                                            <button 
                                              onClick={() => {
                                                if (confirm('Bạn có chắc chắn muốn từ chối bài này và yêu cầu học sinh nộp lại?')) {
                                                  socket?.emit('reject_submission', {
                                                    code: sessionCode,
                                                    studentId: id,
                                                    activityId: currentActivity.activityId || currentActivity.slideNumber,
                                                    fileUrl: meta.url
                                                  });
                                                }
                                              }}
                                              className="mt-1 flex items-center justify-center space-x-1 bg-red-100 text-red-600 hover:bg-red-200 py-1.5 px-3 rounded text-sm font-semibold transition-colors"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                              <span>Yêu cầu nộp lại</span>
                                            </button>
                                          </div>
                                        );
                                      }
                                    } catch(e) {}
                                    return ansText;
                                  })()
                                ) : (
                                  ansText
                                )}
                              </div>`;

if (content.includes(oldPadlet)) {
  content = content.replace(oldPadlet, newPadlet);
  fs.writeFileSync(file, content);
  console.log('Success - patched teacher UI');
} else {
  console.log('Failed to find padlet rendering');
}
