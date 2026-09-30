const fs = require('fs');
const file = 'src/app/teacher/presentations/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'import { PlusCircle, FileText, Upload, Loader2 } from "lucide-react";',
  'import { PlusCircle, FileText, Upload, Loader2, Pencil, Trash2 } from "lucide-react";'
);

content = content.replace(
  '  const handleFileChange = async',
  `  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài giảng này không?')) return;
    try {
      const res = await fetch(\`/api/presentations/\${id}\`, { method: 'DELETE' });
      if (res.ok) setPresentations(prev => prev.filter(p => p.id !== id));
      else alert('Xóa thất bại');
    } catch (e) {
      console.error(e);
      alert('Xóa thất bại');
    }
  };

  const handleEdit = async (id: string, currentTitle: string) => {
    const newTitle = prompt('Nhập tên mới cho bài giảng:', currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    try {
      const res = await fetch(\`/api/presentations/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      if (res.ok) {
        setPresentations(prev => prev.map(p => p.id === id ? { ...p, title: newTitle } : p));
      } else {
        alert('Cập nhật thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Cập nhật thất bại');
    }
  };

  const handleFileChange = async`
);

content = content.replace(
  '<h3 className="font-bold text-lg text-gray-900 mb-1 truncate" title={p.title}>{p.title}</h3>',
  '<div className="flex justify-between items-start mb-1"><h3 className="font-bold text-lg text-gray-900 truncate pr-2" title={p.title}>{p.title}</h3><div className="flex space-x-1 shrink-0"><button onClick={() => handleEdit(p.id, p.title)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors" title="Đổi tên"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors" title="Xóa bài giảng"><Trash2 className="w-4 h-4" /></button></div></div>'
);

fs.writeFileSync(file, content);
