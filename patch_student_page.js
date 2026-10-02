const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { storage } from')) {
  content = content.replace(
    'import { io, Socket } from "socket.io-client";',
    'import { io, Socket } from "socket.io-client";\nimport { storage } from "@/lib/firebaseClient";\nimport { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";'
  );
}

if (!content.includes('const [isUploading, setIsUploading]')) {
  content = content.replace(
    'const [timeLeft, setTimeLeft] = useState<number | null>(null);',
    'const [timeLeft, setTimeLeft] = useState<number | null>(null);\n  const [isUploading, setIsUploading] = useState(false);\n  const [uploadProgress, setUploadProgress] = useState(0);'
  );
}

if (!content.includes('const handleFileUpload = ')) {
  const insertCode = `
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = \`\${studentName || systemId}_\${Date.now()}.\${fileExt}\`;
      const storageRef = ref(storage, \`submissions/\${sessionCode}/\${activity?.activityId || activity?.slideNumber}/\${fileName}\`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload failed", error);
          alert("Lỗi upload file! Vui lòng thử lại.");
          setIsUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setSelectedAnswers([downloadURL]);
          setIsUploading(false);
          // Auto submit after upload finishes
          if (!isLocked && !submitted) {
            let finalAnswer = downloadURL;
            if (activity?.mode === "GROUP" && groupInfo) {
                socket.emit("workspace_update", {
                    code: sessionCode,
                    activityId: activity.activityId,
                    groupId: groupInfo.id,
                    state: finalAnswer
                });
                socket.emit("submit_workspace", {
                  code: sessionCode,
                  activityId: activity.activityId,
                  groupId: groupInfo.id,
                  answer: finalAnswer
                });
            } else {
                socket.emit("submit_answer", {
                  code: sessionCode,
                  slideNumber: activity?.slideNumber,
                  answer: finalAnswer
                });
            }
            setSubmitted(true);
          }
        }
      );
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };
`;
  content = content.replace(
    'const handleSubmit = () => {',
    insertCode + '\n  const handleSubmit = () => {'
  );
}

if (!content.includes('activity.type === "FILE_UPLOAD"')) {
  const fileUploadUI = `
          {activity.type === "FILE_UPLOAD" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-black text-lg mb-2">Nộp file bài làm của bạn:</h3>
              
              {submitted ? (
                <div className="p-4 rounded-xl border-2 border-green-500 bg-green-50 text-green-800 text-center font-medium shadow-sm">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  Đã nộp bài thành công!
                  <div className="text-sm mt-2 font-normal truncate max-w-full"><a href={selectedAnswers[0]} target="_blank" className="underline hover:text-blue-600">Xem lại bài đã nộp</a></div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={isUploading || isLocked}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-gray-400 focus:border-blue-500 cursor-pointer text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50"
                  />
                  {isUploading && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1 font-medium text-blue-700">
                        <span>Đang tải lên...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: \`\${uploadProgress}%\` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
`;
  content = content.replace(
    '{activity.type === "SHORT_ANSWER"',
    fileUploadUI + '\n          {activity.type === "SHORT_ANSWER"'
  );
}

fs.writeFileSync(file, content);
console.log('Success');
