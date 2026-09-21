const fs = require('fs');
let code = fs.readFileSync('src/app/student/[sessionCode]/page.tsx', 'utf8');

const shortAnswerLogic = `
        {activity.type === "SHORT_ANSWER" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-black text-lg mb-2">Nhập câu trả lời của bạn:</h3>
              <textarea
                placeholder="Nhập câu trả lời vào đây..."
                disabled={submitted || isLocked}
                value={selectedAnswers[0] || ''}
                onChange={(e) => setSelectedAnswers([e.target.value])}
                rows={4}
                className="w-full p-4 rounded-xl border-2 text-lg transition-all border-gray-300 focus:border-blue-500 outline-none disabled:opacity-50"
              />
              {activity?.mode !== "GROUP" && (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedAnswers[0] || submitted || isLocked}
                  className={\`w-full py-4 rounded-xl font-bold text-lg text-white flex items-center justify-center mt-6 transition-all \${
                    submitted ? "bg-green-500" : isLocked ? "bg-red-500 cursor-not-allowed" : selectedAnswers[0] ? "bg-blue-600 hover:bg-blue-700 shadow-md transform hover:-translate-y-1" : "bg-gray-300 cursor-not-allowed"
                  }\`}
                >
                  {submitted ? "Đã Gửi" : isLocked ? "Đã Khóa" : "Gửi Câu Trả Lời"}
                </button>
              )}
            </div>
          )}
`;

code = code.replace(
  /\{activity\.type === "WORD_CLOUD" && \(/,
  shortAnswerLogic.trim() + '\n\n          {activity.type === "WORD_CLOUD" && ('
);

fs.writeFileSync('src/app/student/[sessionCode]/page.tsx', code);
console.log('Added SHORT_ANSWER to student app');
