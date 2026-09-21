const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

// 1. Add hook
code = code.replace(
  'const [showResultsModal, setShowResultsModal] = useState(false);',
  'const [showResultsModal, setShowResultsModal] = useState(false);\n  const [zoomLevel, setZoomLevel] = useState(1);'
);

// 2. Add zoom controls
const headerTarget = '<h2 className="text-2xl font-bold text-gray-800">Chi tiáº¿t Káº¿t quáº£ (Slide {selectedSlide})</h2>';
const headerReplacement = `<h2 className="text-2xl font-bold text-gray-800">Chi tiết Kết quả (Slide {selectedSlide})</h2>
                {currentActivity?.type === 'SHORT_ANSWER' && (
                  <div className="flex items-center space-x-2 ml-4 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-sm text-gray-600 font-medium">Thu phóng:</span>
                    <button onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.1))} className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold transition-colors">-</button>
                    <span className="text-sm font-bold w-12 text-center text-blue-600">{Math.round(zoomLevel * 100)}%</span>
                    <button onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.1))} className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold transition-colors">+</button>
                  </div>
                )}`;

// Since the file has some encoding issues with exact match in powershell, let's use a regex that matches the header line safely
code = code.replace(
  /<h2 className="text-2xl font-bold text-gray-800">Chi ti[^<]+<\/h2>/,
  headerReplacement
);

// 3. Update Padlet Rendering
const renderTarget = `{currentActivity?.type === 'SHORT_ANSWER' ? (
                      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {(currentActivity?.mode === 'GROUP' ? Object.values(workspaces).map(ws => [ws.groupId, ws.state]) : Object.entries(responses)).map(([id, ans]) => {`;

const renderReplacement = `{currentActivity?.type === 'SHORT_ANSWER' ? (
                      <div style={{ zoom: zoomLevel }} className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 transition-all duration-300 origin-top">
                        {(currentActivity?.mode === 'GROUP' ? Object.values(workspaces).map(ws => [ws.groupId, ws.state]) : Object.entries(responses)).map(([id, ans], index) => {`;

code = code.replace(renderTarget, renderReplacement);

const cardTargetRegex = /<div key=\{String\(id\)\} className="break-inside-avoid bg-\[#fff9c4\] border border-\[#f57f17\]\/20 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-4">[\s\S]*?<div className="font-bold text-\[#f57f17\] border-b border-\[#f57f17\]\/20 pb-2 mb-2 flex items-center gap-2">[\s\S]*?<div className="w-6 h-6 rounded-full bg-\[#f57f17\] text-white flex items-center justify-center text-xs">\{displayName\.charAt\(0\)\}<\/div>[\s\S]*?<span className="truncate">\{displayName\}<\/span>[\s\S]*?<\/div>[\s\S]*?<div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">\{ansText\}<\/div>/;

const cardReplacement = `
                          const padletColors = [
                            { bg: 'bg-[#fff9c4]', border: 'border-[#fbc02d]', text: 'text-[#f57f17]', avatar: 'bg-[#f57f17]' },
                            { bg: 'bg-[#ffcdd2]', border: 'border-[#e57373]', text: 'text-[#c62828]', avatar: 'bg-[#c62828]' },
                            { bg: 'bg-[#c8e6c9]', border: 'border-[#81c784]', text: 'text-[#2e7d32]', avatar: 'bg-[#2e7d32]' },
                            { bg: 'bg-[#bbdefb]', border: 'border-[#64b5f6]', text: 'text-[#1565c0]', avatar: 'bg-[#1565c0]' },
                            { bg: 'bg-[#e1bee7]', border: 'border-[#ba68c8]', text: 'text-[#6a1b9a]', avatar: 'bg-[#6a1b9a]' },
                            { bg: 'bg-[#ffe0b2]', border: 'border-[#ffb74d]', text: 'text-[#ef6c00]', avatar: 'bg-[#ef6c00]' }
                          ];
                          const color = padletColors[index % padletColors.length];
                          
                          return (
                            <div key={String(id)} className={\`break-inside-avoid \${color.bg} border \${color.border} p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-4\`}>
                              <div className={\`font-bold \${color.text} border-b \${color.border} pb-2 mb-2 flex items-center gap-2\`}>
                                <div className={\`w-6 h-6 rounded-full \${color.avatar} text-white flex items-center justify-center text-xs shrink-0\`}>{displayName.charAt(0)}</div>
                                <span className="truncate">{displayName}</span>
                              </div>
                              <div className="text-gray-900 whitespace-pre-wrap break-words break-all text-[15px] font-medium leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar pr-1">{ansText}</div>`;

code = code.replace(cardTargetRegex, cardReplacement);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Successfully updated Padlet styles and features');
