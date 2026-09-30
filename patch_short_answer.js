const fs = require('fs');
const file = 'src/app/teacher/presentations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\s*currentActivity\.type === "SHORT_ANSWER" && \(\s*<div className="space-y-4">\s*<p className="text-sm text-gray-500">C[\s\S]*?u h[\s\S]*?nh cho c[\s\S]*?u h[\s\S]*?i Tr[\s\S]*? l[\s\S]*?i ng[\s\S]*?n\.<\/p>\s*<\/div>\s*\)\}/;

const replacement = `{currentActivity.type === "SHORT_ANSWER" && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Đáp án đúng (Chấm tự động)</label>
                      <p className="text-xs text-gray-500 mb-2">Nhập các đáp án được chấp nhận, cách nhau bởi dấu phẩy (,). Bỏ trống nếu muốn tự chấm bằng tay.</p>
                      <input 
                        type="text"
                        className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                        placeholder="VD: CPU, Vi xử lý, Bộ vi xử lý..."
                        value={currentActivity.config?.correctAnswers || ''}
                        onChange={(e) => setActivities(prev => ({
                          ...prev,
                          [currentActivityId as string]: { 
                             ...prev[currentActivityId as string], 
                             config: { ...(prev[currentActivityId as string].config || {}), correctAnswers: e.target.value } 
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kiểu khớp đáp án</label>
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                        value={currentActivity.config?.matchMode || 'EXACT'}
                        onChange={(e) => setActivities(prev => ({
                          ...prev,
                          [currentActivityId as string]: { 
                             ...prev[currentActivityId as string], 
                             config: { ...(prev[currentActivityId as string].config || {}), matchMode: e.target.value } 
                          }
                        }))}
                      >
                        <option value="EXACT">Khớp hoàn toàn (Tuyệt đối)</option>
                        <option value="CONTAINS">Chỉ cần chứa từ khóa (Tương đối)</option>
                      </select>
                    </div>
                  </div>
                )}`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Success");
} else {
    console.log("Regex not matched");
}
