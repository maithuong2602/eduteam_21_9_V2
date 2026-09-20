import Link from "next/link";
import { PlusCircle, FileText, Users, Play } from "lucide-react";

export default function TeacherDashboard() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
          <p className="text-gray-500 mt-1">Chào mừng quay lại, hãy bắt đầu một phiên học mới!</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
            <PlusCircle className="mr-2 h-4 w-4 text-gray-500" />
            Tạo Lớp
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700">
            <FileText className="mr-2 h-4 w-4" />
            Upload Bài Giảng
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center text-blue-600 mb-4">
            <FileText className="h-8 w-8 p-1.5 bg-blue-50 rounded-lg" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">12</h3>
          <p className="text-gray-500 font-medium">Bài giảng PowerPoint</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center text-green-600 mb-4">
            <Play className="h-8 w-8 p-1.5 bg-green-50 rounded-lg" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">45</h3>
          <p className="text-gray-500 font-medium">Phiên học đã tổ chức</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center text-purple-600 mb-4">
            <Users className="h-8 w-8 p-1.5 bg-purple-50 rounded-lg" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">5</h3>
          <p className="text-gray-500 font-medium">Lớp học</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Bài giảng gần đây</h2>
            <Link href="/teacher/presentations" className="text-sm text-blue-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 flex items-center justify-center rounded-lg font-bold text-xs">
                    PPTX
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-900">Bài {i} - Thiết bị số.pptx</p>
                    <p className="text-xs text-gray-500">24 slides • Cập nhật hôm qua</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-blue-600 px-3 py-1.5 bg-blue-50 rounded hover:bg-blue-100">
                  Tạo phiên
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Phiên học đang diễn ra</h2>
          </div>
          <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
            <PlaySquare className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">Không có phiên học nào</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Hãy chọn một bài giảng để tạo phiên học mới.</p>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700">
              <Play className="mr-2 h-4 w-4" />
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaySquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m9 8 6 4-6 4Z" />
    </svg>
  )
}
