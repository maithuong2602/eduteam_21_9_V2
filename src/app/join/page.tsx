"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Play } from "lucide-react";
import { io } from "socket.io-client";

export default function StudentJoin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code && name) {
      sessionStorage.setItem("eduteam_session", code);
      sessionStorage.setItem("eduteam_student_name", name); // This is the ID
      
      const socket = io("http://localhost:3001");
      socket.emit('join_session', { code, name });

      socket.on('join_error', (data: any) => {
        alert(data.message);
        socket.disconnect();
      });

      socket.on('join_success', () => {
        router.push(`/student/${code}`);
        socket.disconnect(); // Disconnect here, the student page will reconnect
      });
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight">EduTeam</h1>
          <p className="text-gray-500 mt-2">Tham gia bài học tương tác</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiên học (Session Code)</label>
            <input 
              type="text" 
              required
              placeholder="Ví dụ: 7K4P2"
              className="w-full text-center uppercase text-2xl tracking-widest font-bold border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-3 border"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã học sinh</label>
            <input 
              type="text" 
              required
              placeholder="Ví dụ: HS12345"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-3 px-4 border text-lg uppercase"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
            />
          </div>

          <button 
            type="submit"
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-6"
          >
            <Play className="mr-2 h-5 w-5" />
            Vào lớp
          </button>
        </form>
      </div>
    </div>
  );
}
