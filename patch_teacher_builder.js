const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const insertButton = `                    <button onClick={() => addActivity("EXPLORE")} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                      <Compass className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-2" />
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Khám phá</span>
                    </button>
                    <button onClick={() => addActivity("FILE_UPLOAD")} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                      <svg className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Thu Bài (File)</span>
                    </button>`;

if (!content.includes('addActivity("FILE_UPLOAD")')) {
  content = content.replace(
    /<button onClick={\(\) => addActivity\("EXPLORE"\)}[\s\S]*?<\/button>/,
    insertButton
  );
  fs.writeFileSync(file, content);
  console.log('Success');
}
