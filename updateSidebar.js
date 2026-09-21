const fs = require('fs');

let code = fs.readFileSync('src/components/layout/TeacherSidebar.tsx', 'utf8');

// We need to add logic for handleBackup and handleRestore, so we must add a file input ref.
// Add imports:
if (!code.includes('import { useRef, useState } from "react"')) {
    code = code.replace('"use client";', '"use client";\nimport { useRef, useState } from "react";\nimport { Download, Upload } from "lucide-react";');
}

// Inside TeacherSidebar function:
const logicStr = `
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Bạn có chắc chắn muốn phục hồi dữ liệu từ file này? Dữ liệu hiện tại sẽ bị ghi đè toàn bộ!')) return;

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/restore', { method: 'POST', body: formData });
      if (res.ok) {
        alert('Phục hồi dữ liệu thành công! Trang sẽ tự động tải lại.');
        window.location.reload();
      } else {
        alert('Có lỗi xảy ra khi phục hồi dữ liệu.');
      }
    } catch (e) {
      alert('Có lỗi xảy ra khi phục hồi dữ liệu.');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
`;

// Insert logic inside TeacherSidebar just after pathname
code = code.replace('const pathname = usePathname();', 'const pathname = usePathname();\n' + logicStr);

// Replace the bottom section to include the buttons
const bottomSection = `
      <div className="p-4 border-t border-gray-200">
        <input type="file" accept=".zip" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        
        <div className="flex flex-col space-y-2 mb-4">
          <button onClick={handleBackup} className="flex items-center text-sm px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors w-full">
            <Download className="w-4 h-4 mr-2" /> Sao lưu dữ liệu
          </button>
          <button onClick={handleRestoreClick} disabled={isRestoring} className="flex items-center text-sm px-3 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors w-full">
            <Upload className="w-4 h-4 mr-2" /> {isRestoring ? "Đang phục hồi..." : "Phục hồi dữ liệu"}
          </button>
        </div>

        <div className="flex items-center">
`;

code = code.replace('<div className="flex items-center">', bottomSection);

fs.writeFileSync('src/components/layout/TeacherSidebar.tsx', code);
console.log('Updated TeacherSidebar');
