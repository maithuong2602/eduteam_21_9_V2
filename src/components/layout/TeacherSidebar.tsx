"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Presentation,
  PlaySquare,
  BarChart,
  Settings,
} from "lucide-react";

export default function TeacherSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Tổng quan", href: "/teacher", icon: LayoutDashboard },
    { name: "Lớp học", href: "/teacher/classes", icon: Users },
    { name: "Bài giảng", href: "/teacher/presentations", icon: Presentation },
    { name: "Phiên học", href: "/teacher/sessions", icon: PlaySquare },
    { name: "Báo cáo", href: "/teacher/reports", icon: BarChart },
    { name: "Cài đặt", href: "/teacher/settings", icon: Settings },
  ];

  return (
    <div id="teacher-sidebar" className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shrink-0 transition-all duration-300 z-50">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">EduTeam</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-700" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
            GV
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Giáo viên Demo</p>
            <p className="text-xs text-gray-500">Thoát</p>
          </div>
        </div>
      </div>
    </div>
  );
}
