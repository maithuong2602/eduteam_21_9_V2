const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /try\s*\{\s*const fileExt = file\.name[\s\S]*?setIsUploading\(false\);\s*\}/;

const newHandleFileUpload = `try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionCode', sessionCode);
      formData.append('activityId', activity?.activityId || activity?.slideNumber || 'default');
      formData.append('studentId', systemId);
      formData.append('studentName', studentName || realStudentName || systemId);

      // Simple fake progress for UX since fetch doesn't have native upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/upload_submission', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();
      if (!data.success) throw new Error('Upload failed');

      const downloadURL = data.url;
      // Also pass metadata
      const submissionMetadata = {
          url: data.url,
          filename: data.originalName,
          size: data.size,
          timestamp: data.timestamp
      };

      // Ensure we format it properly for selectedAnswers (string if possible, or JSON string)
      // Since selectedAnswers expects strings often, we stringify it
      setSelectedAnswers([downloadURL]);
      setIsUploading(false);
      
      if (!isLocked && !submitted) {
        if (activity?.mode === "GROUP" && groupInfo) {
            socket.emit("workspace_update", {
                code: sessionCode,
                activityId: activity.activityId,
                groupId: groupInfo.id,
                state: JSON.stringify(submissionMetadata)
            });
            socket.emit("submit_workspace", {
              code: sessionCode,
              activityId: activity.activityId,
              groupId: groupInfo.id,
              answer: JSON.stringify(submissionMetadata)
            });
        } else {
            socket.emit("submit_answer", {
              code: sessionCode,
              slideNumber: activity?.slideNumber,
              answer: JSON.stringify(submissionMetadata)
            });
        }
        setSubmitted(true);
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi upload file! Vui lòng thử lại.");
      setIsUploading(false);
    }`;

if (regex.test(content)) {
  content = content.replace(regex, newHandleFileUpload);
  fs.writeFileSync(file, content);
  console.log('Success - patched student upload');
} else {
  console.log('Regex not matched');
}
