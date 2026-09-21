const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

// 1. Add import
if (!code.includes('import ClassificationBuilder')) {
  code = code.replace(
    'import Link from "next/link";',
    'import Link from "next/link";\nimport ClassificationBuilder from "@/components/ClassificationBuilder";'
  );
}

// 2. Add state
code = code.replace(
  'const [selectedClassForModal, setSelectedClassForModal] = useState<string | null>(null);',
  'const [selectedClassForModal, setSelectedClassForModal] = useState<string | null>(null);\n  const [showClassificationBuilder, setShowClassificationBuilder] = useState(false);'
);

// 3. Update addActivity default for CLASSIFICATION
const addActivityRegex = /items: type === 'CLASSIFICATION' \? \['BÃn phÃm', 'Chuá»™t', 'Micro', 'MÃn hÃ¬nh', 'MÃ¡y in', 'USB'\] : undefined,\s*categories: type === 'CLASSIFICATION' \? \['INPUT', 'OUTPUT', 'STORAGE'\] : undefined/g;
// Note: Due to character encoding issues with Bàn phím etc., let's use a safer regex
code = code.replace(
  /items:\s*type === 'CLASSIFICATION'[\s\S]*?undefined,[\s\S]*?categories:\s*type === 'CLASSIFICATION'[\s\S]*?undefined/g,
  `groups: type === 'CLASSIFICATION' ? [{ id: 'G1', name: 'THIẾT BỊ NHẬP' }, { id: 'G2', name: 'THIẾT BỊ XUẤT' }] : undefined,
          items: type === 'CLASSIFICATION' ? [
            { id: 'I1', text: 'Bàn phím', correctGroupId: 'G1' }, 
            { id: 'I2', text: 'Chuột', correctGroupId: 'G1' }, 
            { id: 'I3', text: 'Màn hình', correctGroupId: 'G2' }
          ] : undefined`
);

// 4. Render the button to open the builder in the config panel
const configPanelRegex = /<Cloud className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-2" \/>[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)}/g;

code = code.replace(
  /\{currentActivity\.type === "MULTIPLE_CHOICE" && \(/g,
  `{currentActivity.type === "CLASSIFICATION" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col items-center text-center">
                        <h4 className="font-bold text-blue-800 mb-2">Trình tạo Phân loại</h4>
                        <p className="text-sm text-blue-600 mb-4">Thiết kế các nhóm và mục kéo thả trực quan cho học sinh</p>
                        <button 
                          onClick={() => setShowClassificationBuilder(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors w-full"
                        >
                          Mở bộ thiết lập
                        </button>
                      </div>
                    </div>
                  )}
                  {currentActivity.type === "MULTIPLE_CHOICE" && (`
);

// 5. Render the modal component at the bottom of the file (before the last closing div)
const lastDivRegex = /\{showGroupModal && \([\s\S]*?<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\)\s*;\s*\}\s*$/;
if (code.match(lastDivRegex)) {
   code = code.replace(lastDivRegex, (match) => {
     return `
        {showClassificationBuilder && currentActivity && currentActivity.type === 'CLASSIFICATION' && (
          <ClassificationBuilder 
            activity={currentActivity} 
            onSave={(updatedActivity: any) => {
              setActivities(prev => ({
                ...prev,
                [currentActivity.id]: updatedActivity
              }));
              setShowClassificationBuilder(false);
            }}
            onClose={() => setShowClassificationBuilder(false)} 
          />
        )}
     ` + match;
   });
} else {
  // If we can't safely match the end of the file, we can inject it right before `{showGroupModal && (`
  code = code.replace(
    '{showGroupModal && (',
    `{showClassificationBuilder && currentActivity && currentActivity.type === 'CLASSIFICATION' && (
          <ClassificationBuilder 
            activity={currentActivity} 
            onSave={(updatedActivity: any) => {
              setActivities(prev => ({
                ...prev,
                [currentActivity.id]: updatedActivity
              }));
            }}
            onClose={() => setShowClassificationBuilder(false)} 
          />
        )}
        {showGroupModal && (`
  );
}

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Successfully integrated ClassificationBuilder');
