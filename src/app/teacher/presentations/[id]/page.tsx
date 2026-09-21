"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { ArrowLeft, Play, Settings, Type, Plus, X, AlignLeft, CheckSquare, List, GripHorizontal, Users, ChevronLeft, ChevronRight, Lock, Unlock, Clock, Cloud, Trophy } from "lucide-react";
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), { ssr: false });

export default function PresentationDetail() {
  const params = useParams();
  const isInitialMount = useRef(true);
  const id = params.id as string;
  const [classList, setClassList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classStudents, setClassStudents] = useState<any[]>([]);
  
  const [presentation, setPresentation] = useState<any>(null);
  const [selectedSlide, setSelectedSlide] = useState(1);
  const [activities, setActivities] = useState<Record<string, any>>({});
  const [slideActivities, setSlideActivities] = useState<Record<number, string[]>>({});
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);

  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Autosave
    if (id && id !== "1" && Object.keys(activities).length > 0) {
      const timeoutId = setTimeout(() => {
        fetch('/api/activities/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            presentationId: id,
            activities,
            slideActivities
          })
        }).catch(console.error);
      }, 1000); // debounce 1s
      return () => clearTimeout(timeoutId);
    }
  }, [activities, slideActivities, id]);

  
  
  




  useEffect(() => { 
    const acts = slideActivities[selectedSlide] || []; 
    if (acts.length > 0 && (!currentActivityId || !acts.includes(currentActivityId))) {
      setCurrentActivityId(acts[0]); 
    } else if (acts.length === 0) {
      setCurrentActivityId(null); 
    }
  }, [selectedSlide, slideActivities]);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  const [isPresenting, setIsPresenting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [timerDuration, setTimerDuration] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [groupApprovalModal, setGroupApprovalModal] = useState<{ groupId: string, name: string, members: any[], selectedMembers: string[] } | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);

  const [allStudentsFromExcel, setAllStudentsFromExcel] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [bonusRequests, setBonusRequests] = useState<string[]>([]);
  const [showBonusModal, setShowBonusModal] = useState(false);

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        if (data.students) setAllStudentsFromExcel(data.students);
      })
      .catch(e => console.error(e));
  }, []);

  const [workspaces, setWorkspaces] = useState<Record<string, any>>({});
  useEffect(() => {
    if (socket && sessionCode && groups.length > 0) {
      const cName = classList.find((c: any) => c.id === selectedClass)?.name;
      if (cName) {
        const classGroups = !cName ? [] : groups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
        socket.emit('sync_groups', { code: sessionCode, groups: classGroups });
      } else {
        socket.emit('sync_groups', { code: sessionCode, groups: [] });
      }
    }
  }, [socket, sessionCode, groups, selectedClass, classList, allStudentsFromExcel]);
  useEffect(() => {
    fetch('/api/groups')
      .then(res => res.json())
      .then(data => {
        if (data.groups && data.groups.length > 0) {
          setGroups(data.groups);
          if (socket && sessionCode) {
            const cName = selectedClassForModal || classList.find((c: any) => c.id === selectedClass)?.name;
            const classGroups = !cName ? [] : data.groups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
            socket.emit("sync_groups", { code: sessionCode, groups: classGroups });
          }
        }
      })
      .catch(e => console.error(e));
  }, []);

  const createGroup = () => {
    if (!selectedClassForModal) {
      alert("Vui lòng chọn lớp học ở cột bên trái trước khi tạo nhóm!");
      return;
    }
    const classGroups = groups.filter(g => g.className === selectedClassForModal || (g.members && g.members.some((m: any) => allStudentsFromExcel.find(s => s.id === m.studentId)?.className === selectedClassForModal)));
    
    const newGroup = {
      id: 'GRP_' + Date.now(),
      name: 'Nhóm ' + (classGroups.length + 1),
      leaderId: null,
      createdAt: Date.now(),
      className: selectedClassForModal,
      members: []
    };
    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    if (socket && sessionCode) {
      const cName = selectedClassForModal || classList.find((c: any) => c.id === selectedClass)?.name;
      const classGroups = !cName ? [] : newGroups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
      socket.emit('sync_groups', { code: sessionCode, groups: classGroups });
    }
  };

  const updateGroupName = (groupId: string, name: string) => {
    const newGroups = groups.map((g: any) => g.id === groupId ? { ...g, name } : g);
    setGroups(newGroups);
    if (socket && sessionCode) {
      const cName = selectedClassForModal || classList.find((c: any) => c.id === selectedClass)?.name;
      const classGroups = !cName ? [] : newGroups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
      socket.emit('sync_groups', { code: sessionCode, groups: classGroups });
    }
  };

  const assignStudentToGroup = (systemId: string, groupId: string) => {
    const newGroups = groups.map(g => {
      const members = g.members.filter((m: any) => m.studentId !== systemId);
      if (g.id === groupId && groupId !== 'NONE') {
        members.push({ studentId: systemId, joinedAt: Date.now() });
      }
      return { ...g, members };
    });
    setGroups(newGroups);
    if (socket && sessionCode) {
      const cName = selectedClassForModal || classList.find((c: any) => c.id === selectedClass)?.name;
      const classGroups = !cName ? [] : newGroups.filter((g: any) => g.className === cName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === cName)));
      socket.emit('sync_groups', { code: sessionCode, groups: classGroups });
    }
  };
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [approvedPoints, setApprovedPoints] = useState<Record<string, number>>({});
  const [leaderboard, setLeaderboard] = useState<{systemId: string, name: string, total: number}[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  // Auto-hide global TeacherSidebar when presenting
  useEffect(() => {
    const sidebar = document.getElementById('teacher-sidebar');
    if (sidebar) {
      if (isPresenting) {
        sidebar.style.display = 'none';
      } else {
        sidebar.style.display = 'flex';
      }
    }
    return () => {
      if (sidebar) sidebar.style.display = 'flex';
    };
  }, [isPresenting]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft !== null && timeLeft > 0 && !isLocked) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !isLocked) {
      toggleLock(true);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isLocked]);

  useEffect(() => {
    if (socket && sessionCode && isPresenting) {
      const currentSlideData = presentation?.slides?.find((s: any) => s.slideNumber === selectedSlide);
      socket.emit('change_slide', {
        code: sessionCode,
        slideNumber: selectedSlide,
        text: currentSlideData?.text || ''
      });
    }
  }, [selectedSlide, socket, sessionCode, isPresenting, presentation]);



  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        if (data.classes) setClassList(data.classes);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetch(`/api/classes/${selectedClass}`)
        .then(res => res.json())
        .then(data => {
          if (data.students) setClassStudents(data.students);
        })
        .catch(console.error);
    }
  }, [selectedClass]);

  useEffect(() => {
    // Basic mock data for id "1"
    if (id === "1") {
      setPresentation({
        id: "1",
        title: "Bài 1: Giới thiệu chung",
        totalSlides: 12,
        type: 'pptx',
        slides: Array.from({ length: 12 }).map((_, i) => ({
          slideNumber: i + 1,
          text: `Nội dung demo của slide ${i + 1}\n\nĐây là trích xuất văn bản từ PowerPoint. Giáo viên có thể xem trước nội dung ở đây.`
        }))
      });
      setActivities({
        3: { type: "MULTIPLE_CHOICE" },
        5: { type: "SHORT_ANSWER" },
      });
      setSelectedSlide(3);
    } else {
      // Try to load dynamically uploaded presentation
      const stored = sessionStorage.getItem(`eduteam_pres_${id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPresentation(parsed);
          setSelectedSlide(parsed.slides?.[0]?.slideNumber || 1);
        } catch (e) {}
      }
    }
    
    // Setup socket
    const newSocket = io(undefined);
    setSocket(newSocket);
    
    newSocket.on("session_created", (data) => {
      setSessionCode(data.code);
      if (selectedClass && groups.length > 0) {
        const currentClassName = classList.find((c: any) => c.id === selectedClass)?.name;
        if (currentClassName) {
          const classGroups = groups.filter((g: any) => g.className === currentClassName || (g.members && g.members.some((m: any) => allStudentsFromExcel.find((s: any) => s.id === m.studentId)?.className === currentClassName)));
          newSocket.emit("sync_groups", { code: data.code, groups: classGroups });
        } else {
          newSocket.emit("sync_groups", { code: data.code, groups: [] });
        }
      } else {
        newSocket.emit("sync_groups", { code: data.code, groups: [] });
      }
    });
    
    newSocket.on("student_joined", (studentsList) => {
      setStudents(studentsList);
    });

    newSocket.on("student_answered", (data) => {
      setResponses(prev => ({
        ...prev,
        [data.studentId]: data.answer
      }));
    });

    newSocket.on("leaderboard_updated", (data) => {
      setLeaderboard(data);
    });

    newSocket.on("history_updated", (data) => {
      setSessionHistory(data);
    });
    
    
    newSocket.on('bonus_requests_updated', (requests: string[]) => {
      setBonusRequests(requests || []);
    });
    
    newSocket.on("export_ledgers_ready", (data) => {
      import('xlsx').then(xlsx => {
        const statsMap = new Map();
        (data.validStudents || presentation?.validStudents || classStudents)?.forEach((s: any) => {
           statsMap.set(String(s.id), { total: 0, act: 0, ind: 0, grp: 0 });
        });

        data.ledgers.forEach((l: any) => {
           const sid = String(l.studentId);
           if (!statsMap.has(sid)) statsMap.set(sid, { total: 0, act: 0, ind: 0, grp: 0 });
           const stat = statsMap.get(sid);
           stat.total += l.points;
           if (l.reason === 'ACTIVITY_SCORE') stat.act += l.points;
           if (l.reason === 'INDIVIDUAL_BONUS') stat.ind += l.points;
           if (l.reason === 'GROUP_BONUS') stat.grp += l.points;
        });

        const rows = (data.validStudents || presentation?.validStudents || classStudents)?.map((st: any) => {
           const statSys = statsMap.get(String(st.systemId)) || { total: 0, act: 0, ind: 0, grp: 0 };
           const statId = statsMap.get(String(st.id)) || { total: 0, act: 0, ind: 0, grp: 0 };
           const stat = {
             total: statSys.total + statId.total,
             act: statSys.act + statId.act,
             ind: statSys.ind + statId.ind,
             grp: statSys.grp + statId.grp
           };
           
           const row: any = {
             "Mã HS": st.systemId || st.id,
             "Tên HS": st.name,
             "Lớp": data.className || "N/A",
             "Nhóm": (data.groups || groups).find((g: any) => g.members && g.members.some((m: any) => m.studentId === st.id))?.name || "Chưa có nhóm",
             "Tổng điểm": stat.total,
             "Activity Score": stat.act,
             "Individual Bonus": stat.ind,
             "Group Bonus": stat.grp
           };
           
           data.history.forEach((h: any) => {
             const actName = h.name || `Slide ${h.slideNumber}`;
             // pointsRecord may use systemId or id
             const pts = (h.pointsRecord && (h.pointsRecord[st.systemId] || h.pointsRecord[st.id])) || 0;
             row[`Điểm hoạt động ${actName}`] = pts;
             row["Tổng điểm"] += pts; // Add activity score to total
           });
           return row;
        });

        const historyRows = data.ledgers.map((l: any) => {
           const act = activities[l.activityId] || {};
           return {
             "Thời gian": new Date(l.createdAt).toLocaleString('vi-VN'),
             "Activity_ID": l.activityId,
             "Tên hoạt động": act.name || 'N/A',
             "Chế độ làm bài": act.mode === 'GROUP' ? 'Theo nhóm' : 'Cá nhân',
             "SourceType": l.reason === 'ACTIVITY_SCORE' ? 'ACTIVITY SCORE' : (l.reason === 'INDIVIDUAL_BONUS' ? 'INDIVIDUAL BONUS' : 'GROUP BONUS'),
             "Group_ID": l.groupId || 'N/A',
             "Points": '+' + l.points,
             "Reason": l.reason
           };
        });
        
        const activityRows = Object.values(activities).map((act: any) => ({
          "Activity_ID": act.id,
          "Tên hoạt động": act.name || `Slide ${act.slideNumber}`,
          "Loại hoạt động": act.type,
          "Thời gian": act.duration || 0,
          "Điểm": act.points || 1,
          "Chế độ làm bài": act.mode === 'GROUP' ? 'Theo nhóm' : 'Cá nhân',
          "Bonus Type": act.bonusType || 'NONE',
          "Bonus Points": act.bonusPoints || 0
        }));

        const wb = xlsx.utils.book_new();
        const wsTongHop = xlsx.utils.json_to_sheet(rows || []);
        xlsx.utils.book_append_sheet(wb, wsTongHop, "TongHop_KetQua");
        
        const wsHistory = xlsx.utils.json_to_sheet(historyRows || []);
        xlsx.utils.book_append_sheet(wb, wsHistory, "Bonus_History");
        
        const wsActivities = xlsx.utils.json_to_sheet(activityRows || []);
        xlsx.utils.book_append_sheet(wb, wsActivities, "Hoat_Dong");

        xlsx.writeFile(wb, `TongHop_KetQua_${sessionCode}.xlsx`);
      });
    });

    newSocket.on("workspace_sync", (ws) => {
      setWorkspaces(prev => ({ ...prev, [ws.groupId]: ws }));
    });
    
    return () => {
      newSocket.disconnect();
    };
  }, [id]);

  const startSession = () => {
    if (!selectedClass) {
      alert("Vui lòng chọn lớp học trước khi tạo phiên!");
      return;
    }
    if (classStudents.length === 0) {
      alert("Đang tải danh sách học sinh của lớp, vui lòng chờ trong giây lát...");
      return;
    }
    if (socket && presentation) {
      socket.emit("create_session", { 
        classId: selectedClass,
        presentationId: presentation.id, 
        title: presentation.title,
        validStudents: classStudents,
        className: classList.find((c: any) => c.id === selectedClass)?.name || "N/A",
        presentationType: presentation.type,
        fileUrl: presentation.fileUrl
      });
      setIsPresenting(true);
    }
  };

  
  const handleApproveGroupPoints = () => {
    if (!socket || !sessionCode || !currentActivityId) return;
    const scores: Record<string, number> = {};
    groups.forEach(g => {
      const ws = workspaces[g.id];
      if (ws && ws.status === 'SUBMITTED') {
         scores[g.id] = currentActivity?.points || 1; // Basic full points for now
      }
    });
    
    socket.emit('approve_group_points', {
      code: sessionCode,
      activityId: currentActivityId,
      scores,
      activityDetails: {
        slideNumber: selectedSlide,
        type: currentActivity?.type,
        name: currentActivity?.name || `HD${selectedSlide}`,
        mode: currentActivity?.mode || 'GROUP',
        bonusType: currentActivity?.bonusType || 'NONE',
        bonusPoints: currentActivity?.bonusPoints || 0
      }
    });
    alert('Đã duyệt điểm nhóm thành công!');
  };

  const handleApprovePoints = (type: 'all' | 'correct_only') => {
    if (!socket || !sessionCode || !currentActivityId) return;
    const currentActivity = activities[currentActivityId] || {};
    const points = currentActivity.points || 1;
    
    const newApproved: Record<string, number> = {};
    const typesMap: Record<string, 'FULL' | 'PARTIAL'> = {};
    
    Object.entries(responses).forEach(([socketId, ans]) => {
      let isCorrect = false;
      if (currentActivity.type === "MULTIPLE_CHOICE") {
        const correctIds = (currentActivity.options || []).filter((o:any) => o.isCorrect).map((o:any) => o.id);
        const studentAnsIds = Array.isArray(ans) ? ans : [ans];
        isCorrect = correctIds.length > 0 && correctIds.length === studentAnsIds.length && correctIds.every((id:any) => studentAnsIds.includes(id));
      } else if (currentActivity.type === "WORD_CLOUD" || currentActivity.type === "SHORT_ANSWER") {
        isCorrect = Array.isArray(ans) ? ans.length > 0 && ans[0] !== "" : ans !== "";
      }
      
      if (type === 'all') {
        newApproved[socketId] = points;
        typesMap[socketId] = 'FULL';
      } else if (type === 'correct_only') {
        newApproved[socketId] = isCorrect ? points : (points * 0.5);
        typesMap[socketId] = isCorrect ? 'FULL' : 'PARTIAL';
      }
    });

    setApprovedPoints(newApproved);
    socket.emit('approve_points', {
      code: sessionCode,
      pointsMap: newApproved,
      typesMap,
      activityDetails: {
        slideNumber: selectedSlide,
        type: currentActivity.type,
        name: currentActivity.name || `HD${selectedSlide}`,
        mode: currentActivity.mode || 'INDIVIDUAL',
        bonusType: currentActivity.bonusType || 'NONE',
        bonusPoints: currentActivity.bonusPoints || 0,
        date: new Date().toLocaleString('vi-VN'),
        responses: responses
      }
    });
    alert("Đã duyệt điểm thành công! Học sinh đã nhận được cúp!");
  };

  const exportExcel = () => {
    if (socket && sessionCode) {
      socket.emit('request_export_ledgers', { code: sessionCode });
    }
  };

  const toggleLock = (locked: boolean) => {
    if (socket && sessionCode) {
      setIsLocked(locked);
      socket.emit(locked ? "lock_activity" : "unlock_activity", { code: sessionCode });
    }
  };

  const startActivityForCurrentSlide = () => {
    if (socket && sessionCode && currentActivityId && activities[currentActivityId]) {
      const currentActivity = activities[currentActivityId];
      const currentSlideData = presentation.slides?.find((s: any) => s.slideNumber === selectedSlide);
      socket.emit("start_activity", {
        code: sessionCode,
        slideNumber: selectedSlide,
        activityId: currentActivityId,
        text: currentSlideData?.text || "",
        presentationType: presentation.type || 'pptx',
        fileUrl: presentation.fileUrl || null,
        activityType: currentActivity.type,
        name: currentActivity.name || `HD${selectedSlide}`,
        mode: currentActivity.mode || 'INDIVIDUAL',
        points: currentActivity.points || 1,
        bonusType: currentActivity.bonusType || 'NONE',
        bonusPoints: currentActivity.bonusPoints || 0,
        endTime: Date.now() + timerDuration * 1000,
        items: currentActivity.items,
        categories: currentActivity.categories,
        options: currentActivity.options || [
           { id: 1, text: "Đáp án A", isCorrect: true },
           { id: 2, text: "Đáp án B", isCorrect: false },
           { id: 3, text: "Đáp án C", isCorrect: false },
           { id: 4, text: "Đáp án D", isCorrect: false }
        ]
      });
      setResponses({}); // Reset responses for new activity
      setApprovedPoints({});
      setIsLocked(false);
      setTimeLeft(timerDuration);
    }
  };

  const nextSlide = () => {
    if (selectedSlide < presentation?.totalSlides) setSelectedSlide(selectedSlide + 1);
  };
  const prevSlide = () => {
    if (selectedSlide > 1) setSelectedSlide(selectedSlide - 1);
  };

  const getActivityName = (type: string | null) => {
    switch(type) {
      case "MULTIPLE_CHOICE": return "Trắc nghiệm";
      case "SHORT_ANSWER": return "Trả lời ngắn";
      case "CLASSIFICATION": return "Phân loại";
      default: return "";
    }
    if (type === 'MULTIPLE_CHOICE') return 'Trắc nghiệm (Nhiều lựa chọn)';
    if (type === 'SHORT_ANSWER') return 'Trả lời ngắn';
    if (type === 'WORD_CLOUD') return 'Word Cloud (Đám mây từ)';
    return 'Chưa có hoạt động';
  };

  const getActivityIcon = (type: string | null) => {
    switch(type) {
      case "MULTIPLE_CHOICE": return <List className="h-4 w-4" />;
      case "SHORT_ANSWER": return <Type className="h-4 w-4" />;
      case "CLASSIFICATION": return <GripHorizontal className="h-4 w-4" />;
      case "WORD_CLOUD": return <Cloud className="h-4 w-4" />;
      default: return null;
    }
  };

  const addActivity = (type: string) => {
    const newId = 'ACT_' + Date.now();
    setActivities(prev => ({
      ...prev,
      [newId]: { 
        id: newId,
        type,
        mode: 'INDIVIDUAL',
        bonusType: 'NONE',
        bonusPoints: 0,
        options: type === 'MULTIPLE_CHOICE' ? [
          { id: 1, text: 'Đáp án A', isCorrect: true },
          { id: 2, text: 'Đáp án B', isCorrect: false },
          { id: 3, text: 'Đáp án C', isCorrect: false },
          { id: 4, text: 'Đáp án D', isCorrect: false }
        ] : undefined,
        items: type === 'CLASSIFICATION' ? ['Bàn phím', 'Chuột', 'Micro', 'Màn hình', 'Máy in', 'USB'] : undefined,
        categories: type === 'CLASSIFICATION' ? ['INPUT', 'OUTPUT', 'STORAGE'] : undefined
      }
    }));
    setSlideActivities(prev => ({
      ...prev,
      [selectedSlide]: [...(prev[selectedSlide] || []), newId]
    }));
    setCurrentActivityId(newId);
  };

  const removeActivity = (actId?: string) => {
    const idToRemove = typeof actId === 'string' ? actId : currentActivityId;
    if (!idToRemove) return;
    setActivities(prev => {
      const next = { ...prev };
      delete next[idToRemove];
      return next;
    });
    setSlideActivities(prev => ({
      ...prev,
      [selectedSlide]: (prev[selectedSlide] || []).filter(id => id !== idToRemove)
    }));
    if (currentActivityId === idToRemove) {
      setCurrentActivityId(null);
    }
  };

  if (!presentation) {
    return <div className="flex h-screen items-center justify-center">Đang tải...</div>;
  }

  const currentSlideData = presentation.slides?.find((s: any) => s.slideNumber === selectedSlide);
  const currentActivity = currentActivityId ? activities[currentActivityId] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] h-screen">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center">
          <Link href="/teacher/presentations" className="mr-4 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{presentation.title}</h1>
          <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Đã lưu
          </span>
          {sessionCode && (
            <span className="ml-3 px-3 py-1 rounded text-sm font-bold bg-blue-100 text-blue-800">
              Mã vào lớp: {sessionCode}
            </span>
          )}
          {bonusRequests.length > 0 && (
            <button 
              onClick={() => setShowBonusModal(true)}
              className="ml-4 px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 animate-pulse flex items-center"
            >
              🙋 {bonusRequests.length} HS xin phát biểu
            </button>
          )}
        </div>
        <div className="flex space-x-3 items-center">
          <button onClick={() => setShowGroupModal(true)} className="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm text-sm font-medium text-indigo-700 hover:bg-indigo-100">
            <Users className="mr-2 h-4 w-4" />
            Quản lý nhóm
          </button>
          {sessionCode ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-md shadow-sm text-sm font-medium text-blue-700">
                <Users className="mr-2 h-4 w-4" />
                {students.filter(s => s.status === 'ONLINE').length} học sinh online
              </div>
            </div>
          ) : (
            <>
              <select style={{ color: "#000", fontWeight: "bold", backgroundColor: "#fff" }} className="border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 py-2 pl-3 pr-8 border outline-none text-black font-bold"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="" style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold">-- Chọn lớp học --</option>
                {classList.map((c) => (
                  <option key={c.id} value={c.id} style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold">{c.name} ({c.studentCount} HS)</option>
                ))}
              </select>
              <button onClick={startSession} className="flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700">
                <Play className="mr-2 h-4 w-4" />
                Tạo phiên học
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Slide List */}
        {!isPresenting && (
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 transition-all">
            <div className="p-3 border-b border-gray-200 bg-gray-100 text-sm font-medium text-gray-700">
              Danh sách Slides ({presentation.totalSlides})
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {presentation.slides?.map((slide: any) => {
                const slideActs = slideActivities[slide.slideNumber] || [];
                const hasActivity = slideActs.length > 0;
                const actType = hasActivity ? activities[slideActs[0]]?.type : null;
                
                return (
                  <div 
                    key={slide.slideNumber}
                    onClick={() => setSelectedSlide(slide.slideNumber)}
                    className={`relative rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSlide === slide.slideNumber 
                        ? "border-blue-500 ring-2 ring-blue-200" 
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <div className="aspect-video bg-white border border-gray-200 rounded flex items-center justify-center relative overflow-hidden">
                      <div className="text-gray-400 font-medium text-xl">Slide {slide.slideNumber}</div>
                      
                      {hasActivity && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white p-1 rounded-full shadow-sm" title={getActivityName(actType)}>
                          {getActivityIcon(actType)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                      <span>{slide.slideNumber}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Center - Slide Preview */}
        <div className="flex-1 bg-gray-200 p-4 md:p-8 flex flex-col items-center justify-center overflow-y-auto relative">
          <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl flex flex-col min-h-[500px] overflow-hidden relative border border-gray-300">
            {presentation?.fileUrl ? (
              <div className="flex-1 w-full flex items-center justify-center bg-gray-100 relative">
                <PdfViewer url={presentation.fileUrl} pageNumber={selectedSlide} />
              </div>
            ) : (
              <div className="p-10 flex-1 flex flex-col whitespace-pre-wrap overflow-y-auto">
                {currentSlideData ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Trích xuất văn bản Slide {selectedSlide}:</h2>
                    <div className="text-lg text-gray-600 font-sans border-l-4 border-blue-500 pl-4 bg-gray-50 p-4 rounded-r">
                      {currentSlideData.text || "(Không có nội dung văn bản)"}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">Đang tải slide...</div>
                )}
              </div>
            )}
            
            {/* Slide Navigation Controls */}
            {isPresenting && (
              <>
                <button onClick={prevSlide} disabled={selectedSlide <= 1} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white disabled:opacity-50 z-20">
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <button onClick={nextSlide} disabled={selectedSlide >= presentation.totalSlides} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white disabled:opacity-50 z-20">
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium z-20 pointer-events-none">
                  {selectedSlide} / {presentation.totalSlides}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Activity Config */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center">
              <Settings className="mr-2 h-4 w-4 text-gray-500" />
              Tương tác (Slide {selectedSlide})
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {/* List of activities for this slide */}
            {(slideActivities[selectedSlide] || []).length > 0 && (
              <div className="mb-4 space-y-2 border-b pb-4">
                <div className="text-sm font-semibold text-gray-700">Các hoạt động:</div>
                {(slideActivities[selectedSlide] || []).map(actId => (
                  <div 
                    key={actId} 
                    onClick={() => setCurrentActivityId(actId)}
                    className={`p-2 rounded cursor-pointer border text-sm flex justify-between items-center ${currentActivityId === actId ? 'bg-blue-50 border-blue-300 font-bold' : 'bg-white border-gray-200'}`}
                  >
                    <span>{activities[actId]?.name || 'Hoạt động'}</span>
                  </div>
                ))}
                <button 
                  onClick={() => setCurrentActivityId(null)}
                  className="w-full mt-2 py-1 border border-dashed border-gray-300 text-gray-500 rounded text-sm hover:bg-gray-50"
                >
                  + Thêm / Chọn hoạt động khác
                </button>
              </div>
            )}

            {currentActivity ? (
              // Has Activity Config
              <div className="space-y-6">
                <div className="bg-blue-50 text-blue-800 p-3 rounded-md border border-blue-100 flex justify-between items-center">
                  <span className="font-medium text-sm flex items-center">
                    {getActivityIcon(currentActivity.type)}
                    <span className="ml-2">{getActivityName(currentActivity.type)}</span>
                  </span>
                  <button onClick={() => removeActivity()} className="text-gray-400 hover:text-red-500 transition-colors" title="Xóa hoạt động">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên hoạt động (VD: B1HD1)</label>
                    <input 
                      type="text" 
                      className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                      placeholder="Nhập tên hoạt động..."
                      value={currentActivity.name || ''}
                      onChange={(e) => setActivities(prev => ({
                        ...prev,
                        [currentActivityId as string]: { ...prev[currentActivityId as string], name: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chế độ làm bài</label>
                      <select 
                        className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                        value={currentActivity.mode || 'INDIVIDUAL'}
                        onChange={(e) => setActivities(prev => ({
                          ...prev,
                          [currentActivityId as string]: { ...prev[currentActivityId as string], mode: e.target.value }
                        }))}
                      >
                        <option className="text-black bg-white font-bold" value="INDIVIDUAL">Cá nhân</option>
                        <option className="text-black bg-white font-bold" value="GROUP">Theo nhóm</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Điểm cộng</label>
                      <input 
                        type="number"
                        min="0"
                        className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                        value={currentActivity.points || 1}
                        onChange={(e) => setActivities(prev => ({
                          ...prev,
                          [currentActivityId as string]: { ...prev[currentActivityId as string], points: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loại Bonus</label>
                      <select 
                        className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                        value={currentActivity.bonusType || 'NONE'}
                        onChange={(e) => setActivities(prev => ({
                          ...prev,
                          [currentActivityId as string]: { ...prev[currentActivityId as string], bonusType: e.target.value }
                        }))}
                      >
                        <option className="text-black bg-white font-bold" value="NONE">Không có</option>
                        <option className="text-black bg-white font-bold" value="INDIVIDUAL">Cá nhân</option>
                        <option className="text-black bg-white font-bold" value="GROUP">Nhóm</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Điểm Bonus</label>
                      <input 
                        type="number"
                        min="0"
                        className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                        value={currentActivity.bonusPoints || 0}
                        onChange={(e) => setActivities(prev => ({
                          ...prev,
                          [currentActivityId as string]: { ...prev[currentActivityId as string], bonusPoints: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {currentActivity.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-4">

                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Cài đặt đáp án</label>
                        <button 
                          onClick={() => {
                            const currentOptions = currentActivity.options || [
                              { id: 1, text: "Đáp án 1", isCorrect: true },
                              { id: 2, text: "Đáp án 2", isCorrect: false }
                            ];
                            setActivities(prev => ({
                              ...prev,
                              [selectedSlide]: { 
                                ...prev[selectedSlide], 
                                options: [...currentOptions, { id: Date.now(), text: `Đáp án ${currentOptions.length + 1}`, isCorrect: false }] 
                              }
                            }));
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Thêm đáp án
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(currentActivity.options || [
                          { id: 1, text: "Đáp án A", isCorrect: true },
                          { id: 2, text: "Đáp án B", isCorrect: false },
                          { id: 3, text: "Đáp án C", isCorrect: false },
                          { id: 4, text: "Đáp án D", isCorrect: false },
                        ]).map((opt: any, index: number) => (
                          <div key={opt.id} className="flex items-center group">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                              checked={opt.isCorrect} 
                              onChange={(e) => {
                                const newOpts = (currentActivity.options || [
                                  { id: 1, text: "Đáp án A", isCorrect: true },
                                  { id: 2, text: "Đáp án B", isCorrect: false },
                                  { id: 3, text: "Đáp án C", isCorrect: false },
                                  { id: 4, text: "Đáp án D", isCorrect: false },
                                ]).map((o: any) => o.id === opt.id ? { ...o, isCorrect: e.target.checked } : o);
                                setActivities(prev => ({
                                  ...prev,
                                  [currentActivityId as string]: { ...prev[currentActivityId as string], options: newOpts }
                                }));
                              }}
                            />
                            <div className="ml-2 flex-1 flex items-center border border-gray-200 rounded px-2 bg-white">
                              <input 
                                type="text"
                                className="w-full text-sm text-gray-900 border-none focus:ring-0 py-1"
                                value={opt.text}
                                onChange={(e) => {
                                  const newOpts = (currentActivity.options || []).map((o: any) => o.id === opt.id ? { ...o, text: e.target.value } : o);
                                  setActivities(prev => ({
                                    ...prev,
                                    [currentActivityId as string]: { ...prev[currentActivityId as string], options: newOpts }
                                  }));
                                }}
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const newOpts = (currentActivity.options || []).filter((o: any) => o.id !== opt.id);
                                setActivities(prev => ({
                                  ...prev,
                                  [currentActivityId as string]: { ...prev[currentActivityId as string], options: newOpts }
                                }));
                              }}
                              className="ml-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">Đánh dấu check để chọn đáp án đúng (có thể chọn nhiều).</p>
                    </div>
                  </div>
                )}
                
                {currentActivity.type === "SHORT_ANSWER" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">Cấu hình cho câu hỏi Trả lời ngắn.</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 mt-6 space-y-3">
                  <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                    Lưu cấu hình
                  </button>
                  {sessionCode && (
                    <>
                      <div className="flex gap-2">
                        <button onClick={() => toggleLock(!isLocked)} className={`flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white ${isLocked ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                          {isLocked ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                          {isLocked ? "Đã khóa" : "Khóa trả lời"}
                        </button>
                        <button onClick={() => {
                          const t = window.prompt("Nhập thời gian (giây):", timerDuration.toString());
                          if (t && !isNaN(parseInt(t))) setTimerDuration(parseInt(t));
                        }} className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">
                          <Clock className="mr-2 h-4 w-4" />
                          {timeLeft !== null ? `${timeLeft}s` : `${timerDuration}s`}
                        </button>
                      </div>
                      <button onClick={startActivityForCurrentSlide} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <Play className="mr-2 h-4 w-4" /> Bắt đầu hoạt động
                      </button>
                    </>
                  )}
                  {sessionCode && currentActivity && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg text-sm border border-gray-200">
                      <div className="font-bold text-gray-700 mb-2 flex justify-between items-center">
                        <span>Kết quả Realtime</span>
                        <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs">{currentActivity?.mode === 'GROUP' ? Object.keys(workspaces).length : Object.keys(responses).length} phản hồi</span>
                      </div>
                      <button 
                        onClick={() => setShowResultsModal(true)} 
                        className="w-full mt-2 bg-indigo-50 text-indigo-700 font-semibold py-2 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors"
                      >
                        Mở bảng Chi tiết Kết quả
                      </button>
                    </div>
                  )}

                  {sessionCode && leaderboard.length > 0 && (
                    <div className="mt-4 bg-white p-4 rounded-lg text-sm border border-yellow-200 shadow-sm">
                      <div className="font-bold text-yellow-700 mb-3 flex items-center">
                        <Trophy className="h-4 w-4 mr-2" />
                        Bảng xếp hạng (Top 5)
                      </div>
                      <div className="space-y-2">
                        {leaderboard.slice(0, 5).map((student, index) => (
                          <div key={student.systemId} className="flex justify-between items-center p-2 rounded bg-gray-50 border border-gray-100">
                            <div className="flex items-center">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-gray-300 text-gray-800' : index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-200 text-gray-700'}`}>
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-700 truncate w-32" title={student.name}>{student.name}</span>
                            </div>
                            <span className="font-bold text-blue-600">{student.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // No Activity - Add New
              <div className="space-y-4">
                <p className="text-sm text-gray-500 text-center mb-6">Chưa có tương tác nào cho slide này. Chọn một loại để thêm:</p>
                
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => addActivity("MULTIPLE_CHOICE")} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                      <List className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-2" />
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Trắc nghiệm</span>
                    </button>
                    <button onClick={() => addActivity("SHORT_ANSWER")} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                      <Type className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-2" />
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Trả lời ngắn</span>
                    </button>
                    <button onClick={() => addActivity("CLASSIFICATION")} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                      <GripHorizontal className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-2" />
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Phân loại</span>
                    </button>
                    <button onClick={() => addActivity("WORD_CLOUD")} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                      <Cloud className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-2" />
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Word Cloud</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      
      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Quản lý Nhóm học sinh</h2>
              <button onClick={() => setShowGroupModal(false)} className="p-2 hover:bg-gray-200 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto flex gap-6">
              {/* Left: Students List */}
              <div className="flex-1 border rounded-xl overflow-hidden flex flex-col">
                <div className="bg-gray-100 p-3 border-b font-bold text-gray-700 flex justify-between items-center">
                  <span>{selectedClassForModal ? `Danh sách lớp ${selectedClassForModal}` : 'Danh sách lớp'}</span>
                  {selectedClassForModal && (
                    <button onClick={() => setSelectedClassForModal(null)} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700">
                      Quay lại chọn lớp
                    </button>
                  )}
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-2">
                  {!selectedClassForModal ? (
                    (() => {
                      const uniqueClasses = Array.from(new Set(allStudentsFromExcel.map(s => s.className).filter(Boolean)));
                      const getSuffix = (cName: any) => {
                        const parts = String(cName).split('/');
                        return parts.length > 1 ? parseInt(parts[1]) : 0;
                      };
                      const haiSon = uniqueClasses.filter(c => getSuffix(c as string) >= 1 && getSuffix(c) <= 6).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
                      const hanMacTu = uniqueClasses.filter(c => getSuffix(c) >= 7).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
                      const other = uniqueClasses.filter(c => getSuffix(c) === 0).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
                      
                      return (
                        <div className="space-y-4 pr-1">
                          {haiSon.length > 0 && (
                            <div>
                              <h4 className="font-bold text-blue-700 bg-blue-50 p-2 rounded-lg mb-2 shadow-sm text-sm border border-blue-100">🏫 Phân hiệu Hải Sơn (Các lớp /1 - /6)</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {haiSon.map((cName: any) => (
                                  <div key={cName} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors text-sm shadow-sm" onClick={() => setSelectedClassForModal(cName)}>
                                    <span className="font-bold text-black">Lớp {cName}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {hanMacTu.length > 0 && (
                            <div>
                              <h4 className="font-bold text-green-700 bg-green-50 p-2 rounded-lg mb-2 shadow-sm text-sm border border-green-100">🏫 Phân hiệu Hàn Mặc Tử (Các lớp /7 trở đi)</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {hanMacTu.map((cName: any) => (
                                  <div key={cName} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors text-sm shadow-sm" onClick={() => setSelectedClassForModal(cName)}>
                                    <span className="font-bold text-gray-700">Lớp {cName}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {other.length > 0 && (
                            <div>
                              <h4 className="font-bold text-gray-700 bg-gray-100 p-2 rounded-lg mb-2 shadow-sm text-sm border border-gray-200">🏫 Khác</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {other.map((cName: any) => (
                                  <div key={cName} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors text-sm shadow-sm" onClick={() => setSelectedClassForModal(cName)}>
                                    <span className="font-bold text-gray-700">Lớp {cName}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    allStudentsFromExcel.filter(s => s.className === selectedClassForModal).map((s: any) => {
                      const studentGroup = groups.find(g => g.members.some((m: any) => m.studentId === s.id));
                      if (studentGroup) return null; // Hide assigned students from list
                      return (
                        <div key={s.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                          <div className="flex items-center">
                            <span className="font-bold text-black text-sm">{s.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (activeGroupId) assignStudentToGroup(s.id, activeGroupId);
                              else alert("Vui lòng click chọn một nhóm ở cột bên phải trước khi thêm học sinh!");
                            }}
                            className="bg-indigo-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-indigo-700 shadow-sm"
                          >
                            Đưa vào nhóm
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              {/* Right: Groups List */}
              <div className="flex-1 flex flex-col space-y-4">
                {!selectedClassForModal ? (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-6 text-center h-full">
                    <Users className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium text-lg">Vui lòng chọn một lớp bên trái</p>
                    <p className="text-gray-400 text-sm mt-1">Danh sách nhóm sẽ hiển thị tương ứng theo lớp</p>
                  </div>
                ) : (
                  <>
                    <button onClick={createGroup} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 transition-colors">
                      + Tạo nhóm mới (Lớp {selectedClassForModal})
                    </button>
                    <div className="space-y-4 overflow-y-auto flex-1">
                      {groups.filter(g => g.className === selectedClassForModal || (g.members && g.members.some((m: any) => allStudentsFromExcel.find(s => s.id === m.studentId)?.className === selectedClassForModal))).map(g => (
                    <div 
                      key={g.id} 
                      onClick={() => setActiveGroupId(g.id)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all ${activeGroupId === g.id ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 shadow-md' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 shadow-sm'}`}
                    >
                      <input 
                        type="text" 
                        value={g.name} 
                        onChange={(e) => updateGroupName(g.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-lg mb-2 border-b border-dashed border-gray-300 bg-transparent focus:outline-none focus:border-indigo-500 w-full text-black placeholder-gray-500"
                      />
                      <div className="text-sm text-gray-500 mb-2 font-medium">Thành viên ({g.members.length}):</div>
                      <div className="flex flex-wrap gap-2">
                        {g.members.map((m: any) => {
                          const sInfo = allStudentsFromExcel.find(vs => vs.id === m.studentId) || presentation?.validStudents?.find((vs: any) => vs.systemId === m.studentId);
                          return (
                            <span key={m.studentId} className="bg-white border border-gray-300 px-2 py-1 rounded-md text-xs font-semibold text-black shadow-sm flex items-center">
                              {sInfo ? sInfo.name : (m.name || m.studentId)}
                              <button 
                                onClick={(e) => { e.stopPropagation(); assignStudentToGroup(m.studentId, 'NONE'); }}
                                className="ml-1.5 text-gray-400 hover:text-red-600 font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Results Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-8 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-800">Chi tiết Kết quả (Slide {selectedSlide})</h2>
                {currentActivity?.type === 'MULTIPLE_CHOICE' && (
                  <label className="flex items-center cursor-pointer ml-4">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={showCorrectAnswer} onChange={(e) => setShowCorrectAnswer(e.target.checked)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${showCorrectAnswer ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showCorrectAnswer ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-gray-700 font-medium">Hiển thị đáp án đúng</div>
                  </label>
                )}
                <div className="flex space-x-3 items-center ml-auto">
                  
                  {currentActivity?.mode === 'GROUP' ? (
                    <button onClick={handleApproveGroupPoints} className="bg-yellow-500 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-yellow-600 transition-colors">
                      Duyệt điểm nhóm (Các nhóm đã Submit)
                    </button>
                  ) : (

                  <div className="relative group inline-block">
                    <button className="bg-yellow-500 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-yellow-600 transition-colors flex items-center">
                      Duyệt điểm ▾
                    </button>
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg hidden group-hover:block z-50">
                      <button onClick={() => handleApprovePoints('all')} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b">
                        Duyệt tất cả (Cộng 100%)
                      </button>
                      <button onClick={() => handleApprovePoints('correct_only')} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100">
                        Duyệt đáp án đúng (Đúng 100%, Sai 50%)
                      </button>
                    </div>
                  </div>
                  )}
                  
                  <button onClick={exportExcel} className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors">
                    Xuất Excel
                  </button>
                  <button onClick={() => { setShowResultsModal(false); setShowCorrectAnswer(false); }} className="bg-white border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
                    Đóng
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl">
                  {currentActivity?.type === 'MULTIPLE_CHOICE' && (
                    <div className="flex items-end h-80 space-x-8 mb-10 border-b-2 border-gray-300 pb-2">
                      {(currentActivity.options || []).map((opt: any, index: number) => {
                        const allAnswers = currentActivity?.mode === 'GROUP' ? Object.values(workspaces).map((ws: any) => ws.state) : Object.values(responses);
                          const totalResponses = allAnswers.length;
                        let count = 0;
                        allAnswers.forEach((ans: any) => {
                          const studentAnsIds = Array.isArray(ans) ? ans : [ans];
                          if (studentAnsIds.includes(opt.id)) count++;
                        });
                        const percent = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
                        const colors = ['bg-green-500', 'bg-red-400', 'bg-blue-500', 'bg-yellow-400'];
                        const bgColor = colors[index % colors.length];
                        
                        const isFaded = showCorrectAnswer && !opt.isCorrect;
                        const showCheck = showCorrectAnswer && opt.isCorrect;

                        return (
                          <div key={opt.id} className={`flex-1 flex flex-col items-center justify-end h-full transition-opacity duration-500 ${isFaded ? 'opacity-30' : 'opacity-100'}`}>
                            {showCheck && (
                              <div className="mb-2 text-green-500 font-bold text-4xl animate-bounce">✓</div>
                            )}
                            <div 
                              className={`w-full ${bgColor} rounded-t-md transition-all duration-700 flex flex-col items-center justify-start pt-2 overflow-hidden shadow-md`}
                              style={{ height: `${percent}%`, minHeight: percent > 0 ? '30px' : '0' }}
                            >
                              {percent > 0 && <span className="text-sm font-bold text-white drop-shadow-md">{count} ({percent}%)</span>}
                            </div>
                            <div className="mt-3 text-2xl font-bold text-gray-700 w-full text-center">
                              {String.fromCharCode(65 + index)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {currentActivity?.type === 'WORD_CLOUD' && (
                  <div className="flex flex-wrap items-center justify-center gap-8 min-h-[300px] mb-10 p-8 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                    {(() => {
                      const wordCounts: Record<string, number> = {};
                      const allAnswers = currentActivity?.mode === 'GROUP' ? Object.values(workspaces).map((ws: any) => ws.state) : Object.values(responses);
                      allAnswers.forEach((ans: any) => {
                        const words = Array.isArray(ans) ? ans : [ans];
                        words.forEach(w => {
                          const word = String(w).trim().toLowerCase();
                          if (word) wordCounts[word] = (wordCounts[word] || 0) + 1;
                        });
                      });
                      
                      const colors = ['text-blue-500', 'text-green-500', 'text-red-400', 'text-yellow-500', 'text-purple-500'];
                      
                      if (Object.keys(wordCounts).length === 0) {
                        return <div className="text-gray-400 italic text-xl">Chưa có dữ liệu</div>
                      }

                      return Object.entries(wordCounts).map(([word, count], i) => {
                        const size = Math.min(2 + (count * 1), 7); // rem
                        const color = colors[i % colors.length];
                        return (
                          <span key={word} className={`font-bold transition-all duration-500 ${color}`} style={{ fontSize: `${size}rem` }}>
                            {word}
                          </span>
                        )
                      });
                    })()}
                  </div>
                )}

                <div className="w-full">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Danh sách chi tiết ({currentActivity?.mode === 'GROUP' ? Object.keys(workspaces).length : Object.keys(responses).length} phản hồi)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(currentActivity?.mode === 'GROUP' ? Object.values(workspaces).map(ws => [ws.groupId, ws.state]) : Object.entries(responses)).map(([id, ans]) => {
                      const displayName = currentActivity?.mode === 'GROUP' 
                        ? (groups.find(g => g.id === id)?.name || id)
                        : (students.find(s => s.id === id)?.name || 'Học sinh ẩn danh');
                        
                      let ansText = typeof ans === 'object' ? JSON.stringify(ans) : String(ans);
                      if (currentActivity?.type === 'MULTIPLE_CHOICE') {
                        const ansIds = Array.isArray(ans) ? ans : [ans];
                        ansText = ansIds.map((optId: any) => {
                          const idx = (currentActivity.options || []).findIndex((o:any) => o.id === optId);
                          return idx >= 0 ? String.fromCharCode(65 + idx) : '';
                        }).join(', ');
                      } else if (currentActivity?.type === 'WORD_CLOUD' || currentActivity?.type === 'SHORT_ANSWER') {
                        ansText = Array.isArray(ans) ? ans.join(', ') : String(ans);
                      }
                      
                      return (
                        <div key={String(id)} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <span className="font-medium text-gray-700">{displayName}</span>
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md max-w-[150px] truncate" title={ansText}>{ansText}</span>
                            {currentActivity?.mode === 'GROUP' && workspaces[id]?.status === 'SUBMITTED' && (
                              <button onClick={() => {
                                const grp = groups.find(g => g.id === String(id));
                                if (grp) {
                                  setGroupApprovalModal({
                                    groupId: grp.id,
                                    name: grp.name,
                                    members: grp.members || [],
                                    selectedMembers: (grp.members || []).map((m: any) => m.studentId)
                                  });
                                }
                              }} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-bold hover:bg-green-600 shrink-0">
                                Duyệt
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Approval Modal */}
      {groupApprovalModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-8 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden relative p-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">
              Duyệt điểm cộng - {groupApprovalModal.name}
            </h2>
            <div className="text-sm text-gray-600 mb-4">
              Hãy đánh dấu (×) để loại bỏ những học sinh không tham gia trả lời. Những học sinh còn lại trong danh sách sẽ được cộng điểm khi bạn bấm Đồng ý.
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto mb-6 space-y-2">
              {groupApprovalModal.members.map((m: any) => {
                const isSelected = groupApprovalModal.selectedMembers.includes(m.studentId);
                return (
                  <div key={m.studentId} className={`flex justify-between items-center p-3 border rounded-lg transition-colors ${isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-100 opacity-50'}`}>
                    <div>
                      <div className="font-bold text-gray-800">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.studentId} - {m.role}</div>
                    </div>
                    <button
                      onClick={() => {
                        setGroupApprovalModal(prev => {
                          if (!prev) return prev;
                          if (isSelected) {
                            return { ...prev, selectedMembers: prev.selectedMembers.filter(id => id !== m.studentId) };
                          } else {
                            return { ...prev, selectedMembers: [...prev.selectedMembers, m.studentId] };
                          }
                        });
                      }}
                      className={`font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isSelected ? 'text-red-500 hover:bg-red-100' : 'text-green-600 hover:bg-green-200'}`}
                    >
                      {isSelected ? '×' : '+'}
                    </button>
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-end space-x-3 mt-auto">
              <button 
                onClick={() => setGroupApprovalModal(null)} 
                className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  if (socket && sessionCode && currentActivityId) {
                    socket.emit('approve_group_points', {
                      code: sessionCode,
                      activityId: currentActivityId,
                      scores: { [groupApprovalModal.groupId]: currentActivity?.points || 1 },
                      approvedMembers: { [groupApprovalModal.groupId]: groupApprovalModal.selectedMembers },
                      activityDetails: {
                        slideNumber: selectedSlide,
                        type: currentActivity?.type,
                        name: currentActivity?.name || `HD${selectedSlide}`,
                        mode: currentActivity?.mode || 'GROUP',
                        bonusType: currentActivity?.bonusType || 'NONE',
                        bonusPoints: currentActivity?.bonusPoints || 0
                      }
                    });
                    setGroupApprovalModal(null);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Đồng ý cộng điểm
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* Bonus Requests Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Danh sách Giơ tay / Xin điểm</h3>
              <button onClick={() => setShowBonusModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {bonusRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Không có học sinh nào giơ tay.</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-end mb-4">
                    <button 
                      onClick={() => {
                        if(socket && sessionCode) {
                          socket.emit('approve_all_bonus', { code: sessionCode });
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm flex items-center transition-colors"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" /> Duyệt tất cả
                    </button>
                  </div>
                  {bonusRequests.map(studentId => {
                    const st = classStudents.find(s => String(s.id) === String(studentId) || String(s.systemId) === String(studentId)) || allStudentsFromExcel.find(s => String(s.id) === String(studentId) || String(s.systemId) === String(studentId));
                    const myGroup = groups.find(g => g.members && g.members.some((m:any) => String(m.studentId) === String(studentId) || String(m.studentId) === String(st?.id) || String(m.studentId) === String(st?.systemId)))?.name || "Chưa có nhóm";
                    return (
                      <div key={studentId} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div>
                          <p className="font-bold text-gray-800">{st ? st.name : studentId} <span className="text-sm font-normal text-indigo-600">({myGroup})</span></p>
                          <p className="text-xs text-gray-500">{st ? st.className : ''}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if(socket && sessionCode) {
                                socket.emit('reject_bonus_request', { code: sessionCode, studentId });
                              }
                            }}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-bold rounded hover:bg-gray-300 shadow-sm transition-colors"
                          >
                            Hủy
                          </button>
                          <button 
                            onClick={() => {
                              if(socket && sessionCode) {
                                socket.emit('approve_individual_bonus', { code: sessionCode, studentId, points: 1 });
                              }
                            }}
                            className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded hover:bg-green-600 shadow-sm transition-colors"
                          >
                            Cộng 1 điểm
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
</div>
  );
}
