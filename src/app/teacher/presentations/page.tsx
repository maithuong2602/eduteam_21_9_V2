"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, FileText, Upload, Loader2 } from "lucide-react";

export default function PresentationsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [presentations, setPresentations] = useState([
    { id: "1", title: "Bài 1 - Thiết bị số.pptx", slides: 24, activities: 5, updatedAt: "Hôm qua" }
  ]);

  useEffect(() => {
    // Load dynamically uploaded presentations from sessionStorage
    const stored = sessionStorage.getItem("eduteam_presentations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPresentations([...parsed, ...presentations]); // put new ones first
        }
      } catch (e) {}
    }
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pptx') && !file.name.toLowerCase().endsWith('.pdf')) {
      alert("Vui lòng chọn file .pptx hoặc .pdf");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (data.success && data.presentation) {
        // Save to session storage
        const stored = sessionStorage.getItem("eduteam_presentations");
        let presList = [];
        if (stored) {
          try { presList = JSON.parse(stored); } catch(e){}
        }
        
        presList.unshift({
          id: data.presentation.id,
          title: data.presentation.title,
          slides: data.presentation.totalSlides,
          activities: 0,
          updatedAt: "Vừa xong"
        });
        sessionStorage.setItem("eduteam_presentations", JSON.stringify(presList));
        sessionStorage.setItem(`eduteam_pres_${data.presentation.id}`, JSON.stringify(data.presentation));

        // Redirect to detail page
        router.push(`/teacher/presentations/${data.presentation.id}`);
      } else {
        alert("Lỗi upload: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý bài giảng</h1>
          <p className="text-gray-500 mt-1">Upload và cấu hình các tương tác cho PowerPoint của bạn</p>
        </div>
        
        <input 
          type="file" 
          accept=".pptx,.pdf" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        <button 
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {isUploading ? "Đang xử lý..." : "Upload PowerPoint"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presentations.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-40 bg-gray-100 border-b border-gray-200 flex items-center justify-center relative">
              <FileText className="h-16 w-16 text-gray-300" />
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {p.slides} slides
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-gray-900 mb-1 truncate" title={p.title}>{p.title}</h3>
              <p className="text-sm text-gray-500 mb-4">Cập nhật: {p.updatedAt}</p>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">{p.activities}</span> hoạt động
                </div>
                <Link 
                  href={`/teacher/presentations/${p.id}`}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors"
                >
                  Thiết lập
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
