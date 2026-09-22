const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

// The slide list is rendered with presentation.slides?.map
const regex = /\{presentation\.slides\?\.map\(\(slide: any\) => \{/g;

// Instead of presentation.slides, let's use Array.from({length: presentation.totalSlides})
const replacement = `{Array.from({ length: presentation.totalSlides || 0 }).map((_, idx) => {
                  const slideNumber = idx + 1;
                  const slideActs = slideActivities[slideNumber] || [];
                  const hasActivity = slideActs.length > 0;
                  const actType = hasActivity ? activities[slideActs[0]]?.type : null;
                  
                  return (
                    <div 
                      key={slideNumber}
                      onClick={() => setSelectedSlide(slideNumber)}
                      className={\`relative rounded-lg border-2 cursor-pointer transition-all \${
                        selectedSlide === slideNumber 
                          ? "border-blue-500 ring-2 ring-blue-200" 
                          : "border-transparent hover:border-gray-300"
                      }\`}
                    >
                      <div className="aspect-video bg-white border border-gray-200 rounded flex items-center justify-center relative overflow-hidden">
                        <div className="text-gray-400 font-medium text-xl">Slide {slideNumber}</div>
                        
                        {hasActivity && (
                          <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold shadow-sm flex items-center">
                            {getActivityIcon(actType)}
                            <span className="ml-1 hidden sm:inline">{getActivityName(actType)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}`;

// We need to replace the entire map block
// Since replacing multiple lines with regex is tricky, let's do a substring replace
const startStr = "{presentation.slides?.map((slide: any) => {";
const endStr = "</div>\n                    </div>\n                  );\n                })}";

let startIndex = code.indexOf(startStr);
if(startIndex > -1) {
    let endIndex = code.indexOf(endStr, startIndex) + endStr.length;
    code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
    fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
    console.log("Successfully patched slide list rendering");
} else {
    console.log("Could not find start string");
}
