const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Render download button for FILE_UPLOAD
const oldCard = `                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 font-medium text-blue-900 break-words whitespace-pre-wrap">{ansText}</div>`;
const newCard = `                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 font-medium text-blue-900 break-words whitespace-pre-wrap">
                              {currentActivity?.type === 'FILE_UPLOAD' && typeof ans === 'string' && ans.startsWith('http') ? (
                                <a href={ans} target="_blank" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 underline">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                  <span>Tải xuống/Xem bài</span>
                                </a>
                              ) : (
                                ansText
                              )}
                            </div>`;

content = content.replace(oldCard, newCard);

content = content.replace(
  `{['SHORT_ANSWER', 'CLASSIFICATION', 'WORD_CLOUD']`,
  `{['SHORT_ANSWER', 'CLASSIFICATION', 'WORD_CLOUD', 'FILE_UPLOAD']`
);
content = content.replace(
  `{['SHORT_ANSWER', 'CLASSIFICATION']`,
  `{['SHORT_ANSWER', 'CLASSIFICATION', 'FILE_UPLOAD']`
);

content = content.replace(
  `currentActivity?.type === 'WORD_CLOUD' || currentActivity?.type === 'SHORT_ANSWER'`,
  `currentActivity?.type === 'WORD_CLOUD' || currentActivity?.type === 'SHORT_ANSWER' || currentActivity?.type === 'FILE_UPLOAD'`
);

fs.writeFileSync(file, content);
console.log('Success');
