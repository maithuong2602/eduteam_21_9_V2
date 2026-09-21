import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon, Trash2, Copy, GripVertical, Settings, Eye, Layout } from 'lucide-react';

export default function ClassificationBuilder({ activity, onSave, onClose }: any) {
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'PREVIEW' | 'SETTINGS'>('CONTENT');
  const [groups, setGroups] = useState<any[]>(activity.groups || [
    { id: 'G1', name: 'Nhóm 1' },
    { id: 'G2', name: 'Nhóm 2' }
  ]);
  const [items, setItems] = useState<any[]>(activity.items || [
    { id: 'I1', text: 'Mục 1', correctGroupId: 'G1' },
    { id: 'I2', text: 'Mục 2', correctGroupId: 'G2' }
  ]);

  const addGroup = () => {
    if (groups.length >= 8) return alert('Tối đa 8 nhóm');
    setGroups([...groups, { id: 'G' + Date.now(), name: `Nhóm ${groups.length + 1}` }]);
  };

  const removeGroup = (groupId: string) => {
    if (groups.length <= 2) return alert('Tối thiểu 2 nhóm');
    if (items.some(i => i.correctGroupId === groupId)) {
      if (!confirm('Nhóm này đang có mục bên trong. Bạn có chắc muốn xóa? Các mục sẽ bị mất.')) return;
    }
    setGroups(groups.filter(g => g.id !== groupId));
    setItems(items.filter(i => i.correctGroupId !== groupId));
  };

  const addItem = (groupId: string) => {
    const groupItems = items.filter(i => i.correctGroupId === groupId);
    if (groupItems.length >= 20) return alert('Tối đa 20 mục mỗi nhóm');
    setItems([...items, { id: 'I' + Date.now(), text: `Mục mới`, correctGroupId: groupId }]);
  };

  const handleSave = () => {
    if (groups.length < 2) return alert('Phải có ít nhất 2 nhóm');
    if (items.length === 0) return alert('Phải có ít nhất 1 mục');
    onSave({ ...activity, groups, items });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4">
      <div className="bg-gray-50 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Trình tạo Hoạt động Phân loại</h2>
            <p className="text-sm text-gray-500">Thiết kế cấu trúc kéo thả cho học sinh</p>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 font-medium">Hủy</button>
            <button onClick={handleSave} className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold shadow">Lưu thay đổi</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b px-6 flex gap-6">
          <button onClick={() => setActiveTab('CONTENT')} className={`py-3 font-medium border-b-2 transition-colors ${activeTab === 'CONTENT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Nội dung</button>
          <button onClick={() => setActiveTab('PREVIEW')} className={`py-3 font-medium border-b-2 transition-colors ${activeTab === 'PREVIEW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Xem trước</button>
          <button onClick={() => setActiveTab('SETTINGS')} className={`py-3 font-medium border-b-2 transition-colors ${activeTab === 'SETTINGS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Cài đặt</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {activeTab === 'CONTENT' && (
            <div className="flex gap-6 overflow-x-auto pb-4 h-full">
              {groups.map(group => (
                <div key={group.id} className="bg-white w-80 shrink-0 rounded-xl shadow-sm border border-gray-200 flex flex-col h-fit max-h-full">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl group/header relative">
                    <input 
                      className="font-bold text-lg w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none px-1 py-0.5 rounded transition-all"
                      value={group.name}
                      onChange={e => setGroups(groups.map(g => g.id === group.id ? { ...g, name: e.target.value } : g))}
                    />
                    <button onClick={() => removeGroup(group.id)} className="absolute right-3 top-4 text-gray-400 hover:text-red-500 opacity-0 group-hover/header:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="p-3 overflow-y-auto space-y-2 custom-scrollbar">
                    {items.filter(i => i.correctGroupId === group.id).map((item, idx) => (
                      <div key={item.id} className="bg-white border border-gray-200 p-2 rounded-lg shadow-sm flex gap-2 items-start group/item">
                        <div className="mt-1 cursor-grab text-gray-300 hover:text-gray-500"><GripVertical className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <textarea 
                            rows={2}
                            className="w-full text-sm resize-none outline-none focus:ring-1 focus:ring-blue-400 p-1 rounded transition-shadow"
                            value={item.text}
                            onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, text: e.target.value } : i))}
                            placeholder="Nhập nội dung..."
                          />
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setItems([...items, { ...item, id: 'I'+Date.now() }])} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"><Copy className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                    
                    <button onClick={() => addItem(group.id)} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium mt-2">
                      <Plus className="w-4 h-4" /> Thêm mục
                    </button>
                  </div>
                </div>
              ))}
              
              <button onClick={addGroup} className="bg-white/50 w-80 shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center h-32 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-colors text-gray-500 font-medium">
                <Plus className="w-6 h-6 mb-2" /> Thêm nhóm
              </button>
            </div>
          )}

          {activeTab === 'PREVIEW' && (
            <div className="bg-white rounded-xl shadow p-8 h-full flex flex-col">
               <h3 className="text-xl font-bold text-center mb-8">BẢN XEM TRƯỚC HỌC SINH</h3>
               <div className="flex flex-wrap gap-3 justify-center mb-12 p-6 bg-gray-50 rounded-xl min-h-[150px] border-2 border-dashed border-gray-200">
                  {items.map(item => (
                    <div key={item.id} className="bg-white border-2 border-gray-300 px-4 py-2 rounded-lg shadow-sm font-medium cursor-grab hover:border-blue-400 hover:shadow-md transition-all">
                      {item.text}
                    </div>
                  ))}
               </div>
               <div className="flex gap-4 justify-center">
                 {groups.map(g => (
                   <div key={g.id} className="w-64 bg-gray-50 border-2 border-gray-300 rounded-xl min-h-[250px] flex flex-col shadow-sm">
                     <div className="bg-gray-200 py-3 font-bold text-center border-b-2 border-gray-300 rounded-t-lg">{g.name}</div>
                     <div className="flex-1 p-3 flex flex-col gap-2"></div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'SETTINGS' && (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <h3 className="text-lg font-bold mb-4">Cài đặt nâng cao</h3>
               <div className="space-y-4">
                 <label className="flex items-center gap-3">
                   <input type="checkbox" className="w-5 h-5 rounded text-blue-600" defaultChecked={true} />
                   <span>Cho phép học sinh kéo thả lại mục đã phân loại</span>
                 </label>
                 <label className="flex items-center gap-3">
                   <input type="checkbox" className="w-5 h-5 rounded text-blue-600" defaultChecked={true} />
                   <span>Trộn thứ tự các mục khi bắt đầu</span>
                 </label>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
