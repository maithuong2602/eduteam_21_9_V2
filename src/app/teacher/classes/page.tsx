"use client";

import { useState, useEffect } from "react";
import { Users, Search, Plus, ArrowLeft, Star, RotateCcw, AlertCircle } from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = () => {
    setLoading(true);
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        if (data.classes) setClasses(data.classes);
        setLoading(false);
      })
      .catch(console.error);
  };

  const openClass = (c: any) => {
    setSelectedClass(c);
    setLoadingStudents(true);
    fetch(`/api/classes/${c.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.students) setStudents(data.students);
        if (data.class) {
           setSelectedClass(data.class);
        }
        setLoadingStudents(false);
      })
      .catch(console.error);
  };

  const handleResetBonus = async () => {
    if (!selectedClass) return;
    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/reset-bonus`, {
        method: 'POST'
      });
      if (res.ok) {
        setShowConfirmReset(false);
        openClass(selectedClass);
        fetchClasses(); // Refresh class list to update total bonus
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedClass) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <button 
          onClick={() => setSelectedClass(null)} 
          className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 sm:flex sm:items-center sm:justify-between bg-gradient-to-r from-blue-50 to-white">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Lớp {selectedClass.name}</h1>
              <div className="flex flex-wrap gap-5 text-sm text-gray-600">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-blue-500" />
                  Sĩ số: <strong className="ml-1 text-gray-900">{selectedClass.studentCount}</strong>
                </span>
                <span className="flex items-center">
                  <span className="w-5 h-5 mr-1.5 bg-gray-200 text-gray-600 flex items-center justify-center rounded text-[10px] font-bold">Mã</span>
                  Mã lớp: <strong className="ml-1 text-gray-900 tracking-wider">{selectedClass.code}</strong>
                </span>
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1.5 text-yellow-500 fill-yellow-500" />
                  Tổng điểm cộng: <strong className="ml-1 text-gray-900">{selectedClass.cumulativeBonus || 0}</strong>
                </span>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <button 
                onClick={() => setShowConfirmReset(true)}
                className="flex items-center px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Đặt lại điểm cộng
              </button>
            </div>
          </div>

          <div className="p-0 border-t border-gray-200">
            {loadingStudents ? (
              <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                <p className="font-medium">Đang tải danh sách học sinh...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Học sinh</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã HS</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm cộng tích lũy</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                            {s.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {s.systemId || s.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-bold bg-amber-100 text-amber-800">
                          {s.bonusPoints || 0}
                          <Star className="w-3.5 h-3.5 ml-1.5 text-amber-600 fill-current" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {showConfirmReset && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-900/60 transition-opacity backdrop-blur-sm" onClick={() => setShowConfirmReset(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-bold text-gray-900">Xác nhận đặt lại điểm cộng</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 leading-relaxed">
                          Bạn có chắc chắn muốn đặt lại điểm cộng cho lớp <strong className="text-gray-900">{selectedClass.name}</strong> về 0 không? Thao tác này sẽ xóa điểm của tất cả học sinh trong lớp và <strong className="text-red-600">không thể hoàn tác</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button type="button" onClick={handleResetBonus} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-5 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm transition-colors">
                    Xác nhận đặt lại
                  </button>
                  <button type="button" onClick={() => setShowConfirmReset(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-5 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors">
                    Hủy bỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Lớp học</h1>
          <p className="text-gray-500 mt-2 text-sm">Theo dõi tiến độ, sĩ số và điểm cộng của các lớp</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm lớp học hoặc mã lớp..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none shadow-sm transition-all"
            />
          </div>
          <button className="flex items-center px-4 py-2.5 bg-blue-600 rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" />
            Thêm lớp
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 h-48 border border-gray-100 shadow-sm animate-pulse flex flex-col justify-between">
              <div className="h-7 bg-gray-200 rounded-md w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>
              <div className="h-10 bg-gray-100 rounded-lg mt-4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClasses.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="p-6 border-b border-gray-50 flex-1 relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users className="w-16 h-16 text-blue-600" />
                </div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <h3 className="text-3xl font-bold text-gray-900">{c.name}</h3>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-700 border border-blue-100 tracking-widest shadow-sm">
                    {c.code}
                  </span>
                </div>
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <Users className="w-4 h-4 mr-3 text-gray-400" />
                    <span>Sĩ số: <strong className="text-gray-900 font-bold">{c.studentCount}</strong> học sinh</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 bg-amber-50/50 p-2 rounded-lg">
                    <Star className="w-4 h-4 mr-3 text-amber-500 fill-amber-500" />
                    <span>Tổng điểm cộng: <strong className="text-gray-900 font-bold">{c.cumulativeBonus || 0}</strong></span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50/50 group-hover:bg-blue-50/30 transition-colors">
                <button 
                  onClick={() => openClass(c)}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-bold text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200"
                >
                  Vào lớp
                </button>
              </div>
            </div>
          ))}
          {filteredClasses.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Search className="w-8 h-8 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium">Không tìm thấy lớp học nào.</p>
              <p className="text-sm mt-1">Vui lòng thử lại với từ khóa khác.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
