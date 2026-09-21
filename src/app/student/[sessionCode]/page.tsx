"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Send, CheckCircle, Trophy , Users} from "lucide-react";
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), { ssr: false });

export default function StudentSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [studentName, setStudentName] = useState("");
  const [realStudentName, setRealStudentName] = useState<string>("");
  const [bonusRequests, setBonusRequests] = useState<string[]>([]);
  const [status, setStatus] = useState("connecting");
  const [activity, setActivity] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [trophy, setTrophy] = useState<{show: boolean, points: number, label?: string, type?: string}>({show: false, points: 0, label: "", type: "FULL"});
  const [leaderboard, setLeaderboard] = useState<{systemId: string, name: string, total: number}[]>([]);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [selectedViewGroup, setSelectedViewGroup] = useState<any>(null);
  const [workspaceState, setWorkspaceState] = useState<any>({});
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const [workspaceStatus, setWorkspaceStatus] = useState("WORKING");

  useEffect(() => {
    if (activity?.mode === 'GROUP' && groupInfo) {
      socket?.emit('request_workspace_sync', { code: sessionCode, activityId: activity.activityId, groupId: groupInfo.id });
    } else {
      setWorkspaceState({});
      setWorkspaceVersion(0);
      setWorkspaceStatus("WORKING");
    }
  }, [activity, groupInfo, socket, sessionCode]);

  useEffect(() => {
    if (!socket) return;
    const handleSync = (ws: any) => {
      if (ws.activityId === activity?.activityId && ws.groupId === groupInfo?.id) {
        if (ws.version >= workspaceVersion) {
          setWorkspaceState(ws.state || {});
          setWorkspaceVersion(ws.version);
          setWorkspaceStatus(ws.status || "WORKING");
        }
      }
    };
    socket.on('workspace_sync', handleSync);
    const handleSubmitGroup = (data: any) => {
      if (data.groupId === groupInfo?.id) setWorkspaceStatus('SUBMITTED');
    };
    socket.on('group_submitted', handleSubmitGroup);
    return () => {
      socket.off('workspace_sync', handleSync);
      socket.off('group_submitted');
    };
  }, [socket, activity, groupInfo, workspaceVersion]);

  const handleWorkspaceChange = (item: string, value: string) => {
    const newState = { ...workspaceState, [item]: value };
    setWorkspaceState(newState);
    
    if (activity?.mode === 'GROUP') {
      const newVersion = workspaceVersion + 1;
      setWorkspaceVersion(newVersion);
      socket?.emit('group_workspace_update', {
        code: sessionCode,
        activityId: activity.activityId,
        groupId: groupInfo.id,
        state: newState,
        version: newVersion,
        studentId: studentName
      });
      socket?.emit('group_presence_update', {
        code: sessionCode,
        activityId: activity.activityId,
        groupId: groupInfo.id,
        studentId: studentName,
        status: 'ACTIVE'
      });
    }
  };

  useEffect(() => {
    const name = sessionStorage.getItem("eduteam_student_name");
    if (!name) {
      router.push("/join");
      return;
    }
    setStudentName(name);

    const newSocket = io(undefined);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("join_session", { code: sessionCode, name });
    });

    newSocket.on("join_error", (data) => {
      alert(data.message);
      router.push("/join");
    });

    newSocket.on("bonus_requests_updated", (requests) => {
      setBonusRequests(requests || []);
    });
    newSocket.on("joined", (data) => {
      setStatus("waiting");
      if (data.activityConfig) {
        setActivity(data.activityConfig);
        setStatus("active");
        setSubmitted(false);
        setSelectedAnswers([]);
      }
    });

    newSocket.on("error", (msg) => {
      alert(msg);
      router.push("/join");
    });

    newSocket.on("activity_started", (config) => {
      setActivity(config);
      setStatus("active");
      setSubmitted(false);
      setSelectedAnswers([]);
      setIsLocked(false);
    });

    newSocket.on("activity_locked", () => {
      setIsLocked(true);
    });

    newSocket.on("slide_changed", (data) => {
      setActivity({
        type: "NONE",
        slideNumber: data.slideNumber,
        presentationType: data.presentationType,
        fileUrl: data.fileUrl,
        text: data.text
      });
      setStatus("active");
    });

    newSocket.on("activity_unlocked", () => {
      setIsLocked(false);
    });

    
    newSocket.on("group_bonus_awarded", (data) => {
      // Handled by points_awarded now
    });

    newSocket.on("points_awarded", (pointsMap, typesMap = {}) => {
      const socketId = newSocket.id;
      const myId = name;
      const myPoints = (socketId && pointsMap[socketId]) || (myId && pointsMap[myId]) || 0;
      const myType = (socketId && typesMap[socketId]) || (myId && typesMap[myId]) || 'FULL';
      
      if (myPoints !== 0) {
        let label = "";
        if (myType === 'PENALTY') label = "điểm (Tự hủy giơ tay)";
        else if (myType === 'TEACHER_REJECT_PENALTY') label = "điểm (Bị từ chối)";
        else label = "điểm";
        
        setTrophy({ show: true, points: myPoints, label, type: myType });
        setTimeout(() => {
          setTrophy({ show: false, points: 0, label: "", type: 'FULL' });
        }, 5000);
      }
    });

    newSocket.on("groups_updated", (groups: any[]) => {
      setAvailableGroups(groups);
      const myId = name;
      const myGroup = groups.find((g: any) => g.members.some((m: any) => m.studentId === myId));
      if (myGroup) setGroupInfo(myGroup);
      else setGroupInfo(null);
    });
    
    newSocket.on("group_member_joined", (groups: any[]) => {
      setAvailableGroups(groups);
      const myId = name;
      const myGroup = groups.find((g: any) => g.members.some((m: any) => m.studentId === myId));
      if (myGroup) setGroupInfo(myGroup);
      else setGroupInfo(null);
    });
    newSocket.on("group_member_left", (groups: any[]) => {
      setAvailableGroups(groups);
      const myId = name;
      const myGroup = groups.find((g: any) => g.members.some((m: any) => m.studentId === myId));
      if (myGroup) setGroupInfo(myGroup);
      else setGroupInfo(null);
    });
    newSocket.on("group_created", (groups: any[]) => {
      setAvailableGroups(groups);
      const myId = name;
      const myGroup = groups.find((g: any) => g.members.some((m: any) => m.studentId === myId));
      if (myGroup) setGroupInfo(myGroup);
      else setGroupInfo(null);
    });
    newSocket.on("leaderboard_updated", (data) => {
      setLeaderboard(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionCode, router]);

  const toggleAnswer = (id: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedAnswers.length === 0 || !socket) return;
    socket.emit("submit_answer", {
      code: sessionCode,
      slideNumber: activity.slideNumber,
      answer: selectedAnswers
    });
    setSubmitted(true);
  };

  if (status === "connecting") {
    return <div className="flex h-screen items-center justify-center bg-blue-50 text-blue-600 font-bold">Đang kết nối vào lớp...</div>;
  }

  if (status === "waiting" || !activity) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-blue-50 p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-6 animate-pulse">
          <span className="text-2xl font-bold text-blue-600">{studentName.charAt(0)}</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Xin chào, {realStudentName || studentName}!</h2>
        <p className="text-gray-600">Bạn đã vào lớp thành công. Hãy đợi giáo viên bắt đầu hoạt động nhé.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 relative overflow-hidden">
      <style>{`
          @keyframes epicTrophyRed {
            0% { transform: translateY(100px) scale(0.5); opacity: 0; filter: drop-shadow(0 0 0px rgba(239, 68, 68, 0)); }
            15% { transform: translateY(0px) scale(1.2); opacity: 1; filter: drop-shadow(0 0 40px rgba(239, 68, 68, 0.8)); }
            20% { transform: translateY(0px) scale(1) rotate(-10deg); filter: drop-shadow(0 0 50px rgba(239, 68, 68, 1)); }
            25% { transform: translateY(0px) scale(1) rotate(10deg); }
            30% { transform: translateY(0px) scale(1) rotate(-10deg); }
            35% { transform: translateY(0px) scale(1) rotate(0deg); }
            70% { transform: translateY(-10px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(239, 68, 68, 1)); }
            100% { transform: translateY(-200px) scale(0.5); opacity: 0; filter: drop-shadow(0 0 0px rgba(239, 68, 68, 0)); }
          }
          .epic-trophy-red {
            animation: epicTrophyRed 4.5s ease-out forwards;
          }
          @keyframes epicTrophyFlySilver {
            0% { transform: translateY(100px) scale(0.5); opacity: 0; }
            15% { transform: translateY(0px) scale(1.2); opacity: 1; filter: drop-shadow(0 0 20px rgba(148, 163, 184, 0.8)); }
            25% { transform: translateY(0px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(148, 163, 184, 1)); }
            70% { transform: translateY(-10px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(148, 163, 184, 1)); }
            100% { transform: translateY(-200px) scale(0.5); opacity: 0; filter: drop-shadow(0 0 0px rgba(148, 163, 184, 0)); }
          }
          .epic-trophy-silver {
            animation: epicTrophyFlySilver 4.5s ease-out forwards;
          }
          @keyframes epicTrophyFly {
            0% { transform: translateY(100px) scale(0.5); opacity: 0; }
            15% { transform: translateY(0px) scale(1.2); opacity: 1; filter: drop-shadow(0 0 20px rgba(250, 204, 21, 0.8)); }
            25% { transform: translateY(0px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(250, 204, 21, 1)); }
            70% { transform: translateY(-10px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(250, 204, 21, 1)); }
            100% { transform: translateY(-200px) scale(0.5); opacity: 0; filter: drop-shadow(0 0 0px rgba(250, 204, 21, 0)); }
          }
          @keyframes scorePop {
            0% { transform: scale(0.5); opacity: 0; }
            20% { transform: scale(1.5); opacity: 1; }
            30% { transform: scale(1); opacity: 1; }
            70% { transform: scale(1); opacity: 1; }
            100% { transform: translateY(-50px); opacity: 0; }
          }
          .epic-trophy {
            animation: epicTrophyFly 4.5s ease-out forwards;
          }
          .epic-score {
            animation: scorePop 4.5s ease-out forwards;
          }
          .trophy-container {
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            pointer-events: none;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
            animation: fadeInOut 4.5s ease-in-out forwards;
          }
          @keyframes fadeInOut {
            0% { opacity: 0; backdrop-filter: blur(0px); }
            10% { opacity: 1; backdrop-filter: blur(4px); }
            70% { opacity: 1; backdrop-filter: blur(4px); }
            100% { opacity: 0; backdrop-filter: blur(0px); }
          }
      `}</style>
      
      {trophy.show && (
        <div className="trophy-container">
          <div className="flex flex-col items-center">
            {trophy.type === 'PENALTY' || trophy.type === 'TEACHER_REJECT_PENALTY' ? (
              <>
                <div className="relative epic-trophy-red">
                  <Trophy className="w-48 h-48 text-red-500 fill-red-400" />
                  <div className="absolute inset-0 flex items-center justify-center text-7xl font-black text-white drop-shadow-md">X</div>
                </div>
                <div className="text-6xl font-black mt-6 epic-score drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] text-red-600">
                  {trophy.points} {trophy.label}
                </div>
              </>
            ) : (
              <>
                <Trophy className={`w-48 h-48 ${trophy.type === 'PARTIAL' ? 'text-slate-400 fill-slate-300 epic-trophy-silver' : 'text-yellow-400 fill-yellow-400 epic-trophy'}`} />
                <div className={`text-6xl font-black mt-6 epic-score drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] ${trophy.type === 'PARTIAL' ? 'text-slate-500' : 'text-yellow-500'}`}>
                  +{trophy.points} {trophy.label || "điểm"}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <div className="font-bold text-blue-600">EduTeam</div>
        <div className="flex items-center space-x-4">
          {bonusRequests.includes(studentName) ? (
            <button 
              onClick={() => {
                if(socket) socket.emit('cancel_bonus_request', { code: sessionCode, studentId: studentName });
              }}
              className="flex items-center space-x-1 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-full border border-red-300 transition-colors shadow-sm active:scale-95 animate-pulse"
              title="Hủy giơ tay"
            >
              <span className="text-lg leading-none">❌</span>
              <span className="text-sm font-bold text-red-700 hidden sm:inline">Hủy giơ tay</span>
            </button>
          ) : (
            <button 
              onClick={() => {
                if(socket) socket.emit('request_bonus', { code: sessionCode, studentId: studentName });
              }}
              className="flex items-center space-x-1 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-full border border-green-300 transition-colors shadow-sm active:scale-95"
              title="Xin điểm thưởng / Phát biểu"
            >
              <span className="text-lg leading-none">🙋</span>
              <span className="text-sm font-bold text-green-700 hidden sm:inline">Phát biểu</span>
            </button>
          )}
          {(() => {
             const myRankIndex = leaderboard.findIndex(s => String(s.systemId).trim() === String(studentName).trim());
             const myPoints = myRankIndex >= 0 ? leaderboard[myRankIndex].total : 0;
             if (myRankIndex >= 0) {
               return (
                 <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                   <Trophy className="w-4 h-4 text-yellow-500" />
                   <span className="text-sm font-bold text-yellow-700">Hạng {myRankIndex + 1} ({myPoints}đ)</span>
                 </div>
               )
             }
             return null;
          })()}
          <div className="text-sm font-medium text-gray-500">{studentName}</div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full flex flex-col">
        {/* Slide Text Display */}
        <div className="bg-white p-2 md:p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 flex-1 min-h-[200px] overflow-hidden">
          {activity.fileUrl ? (
            <PdfViewer url={activity.fileUrl} pageNumber={activity.slideNumber} />
          ) : (
            <div className="text-xl md:text-2xl font-medium text-black whitespace-pre-wrap font-bold leading-relaxed">
              {activity.text || "Nội dung slide..."}
            </div>
          )}
        </div>

        {/* Interaction Area */}
        {activity.type === "CLASSIFICATION" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-black text-lg mb-2">Phân loại các mục sau:</h3>
            <div className="grid grid-cols-1 gap-3">
              {activity.items?.map((item: string) => (
                <div key={item} className="flex justify-between items-center p-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <span className="font-bold text-black">{item}</span>
                  <select
                    value={workspaceState[item] || ""}
                    onChange={(e) => handleWorkspaceChange(item, e.target.value)}
                    disabled={isLocked || workspaceStatus === "SUBMITTED"}
                    className="border-2 border-blue-200 p-2 rounded-lg outline-none focus:border-blue-500 min-w-[150px]"
                  >
                    <option style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold" value="">-- Chọn --</option>
                    {activity.categories?.map((cat: string) => (
                      <option style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold" key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {activity.type === "MULTIPLE_CHOICE" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-black text-lg mb-2">Chọn đáp án của bạn:</h3>
            <div className="grid grid-cols-1 gap-3">
              {activity.options?.map((opt: any) => {
                const isSelected = selectedAnswers.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleAnswer(opt.id)}
                    disabled={submitted || isLocked}
                    className={`p-4 rounded-xl border-2 text-left text-lg transition-all ${
                      isSelected 
                        ? "border-blue-500 bg-blue-50 text-blue-800 font-medium" 
                        : "border-gray-300 bg-white text-black hover:border-blue-400 font-medium shadow-sm"
                    } ${(submitted || isLocked) && !isSelected ? "opacity-50" : ""}`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {activity?.mode !== "GROUP" && (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswers.length === 0 || submitted || isLocked}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white flex items-center justify-center mt-6 transition-all ${
                submitted 
                  ? "bg-green-500" 
                  : isLocked
                  ? "bg-red-500 cursor-not-allowed"
                  : selectedAnswers.length > 0 ? "bg-blue-600 hover:bg-blue-700 shadow-md transform hover:-translate-y-1" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {submitted ? (
                <>
                  <CheckCircle className="mr-2 h-6 w-6" /> Đã gửi đáp án
                </>
              ) : isLocked ? (
                <>
                  <CheckCircle className="mr-2 h-6 w-6" /> Đã khóa trả lời
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" /> Gửi đáp án
                </>
              )}
            </button>
            )}
          </div>
        )}

        {activity.type === "WORD_CLOUD" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-black text-lg mb-2">Nhập từ khóa của bạn:</h3>
              <input
                type="text"
                placeholder="Ví dụ: công nghệ, AI..."
                disabled={submitted || isLocked}
                value={selectedAnswers[0] || ''}
                onChange={(e) => setSelectedAnswers([e.target.value])}
                className="w-full p-4 rounded-xl border-2 text-lg transition-all border-gray-300 focus:border-blue-500 outline-none disabled:opacity-50"
              />
              {activity?.mode !== "GROUP" && (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswers[0] || submitted || isLocked}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white flex items-center justify-center mt-6 transition-all ${
                  submitted ? "bg-green-500" : isLocked ? "bg-red-500 cursor-not-allowed" : selectedAnswers[0] ? "bg-blue-600 hover:bg-blue-700 shadow-md transform hover:-translate-y-1" : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {submitted ? "Đã Gửi" : isLocked ? "Đã Khóa" : "Gửi Từ Khóa"}
              </button>
            )}
          </div>
        )}
        
        
        {activity?.mode === "GROUP" && availableGroups.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6 shadow-sm">
            <h3 className="font-bold text-indigo-900 mb-3 text-lg flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Tra cứu danh sách nhóm
            </h3>
            <select 
              className="w-full p-3 border-2 border-indigo-100 rounded-lg bg-white mb-3 text-indigo-900 font-medium focus:ring-2 focus:ring-indigo-300 outline-none transition-all"
              onChange={(e) => {
                const selectedGrp = availableGroups.find(g => g.id === e.target.value);
                setSelectedViewGroup(selectedGrp || null);
              }}
              value={selectedViewGroup?.id || ""}
            >
              <option style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold" value="" disabled>-- Bấm để chọn nhóm --</option>
              {availableGroups.map(g => (
                <option style={{ color: "#000", fontWeight: "bold" }} className="text-black bg-white font-bold" key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            
            {selectedViewGroup && (
              <div className="bg-white rounded-lg p-4 border border-indigo-100 mt-2 animate-fade-in">
                <h4 className="font-bold text-gray-700 border-b pb-2 mb-2">Thành viên của {selectedViewGroup.name}</h4>
                {selectedViewGroup.members && selectedViewGroup.members.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedViewGroup.members.map((m: any, idx: number) => (
                      <li key={idx} className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                        <span className="font-medium mr-2">{m.name}</span> 
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{m.role || 'Thành viên'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic text-sm">Chưa có thành viên nào.</p>
                )}
                
                {(!groupInfo || groupInfo.id !== selectedViewGroup.id) && (
                  <button 
                    onClick={() => {
                       socket?.emit('group_member_joined', { code: sessionCode, groupId: selectedViewGroup.id, studentId: name, studentName: name });
                       setGroupInfo(selectedViewGroup);
                    }}
                    className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Tham gia {selectedViewGroup.name}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activity?.mode === "GROUP" && (
          <div className="mt-6">
            <button
              onClick={() => {
                if (!groupInfo) {
                  alert("Vui lòng chọn nhóm ở phần 'Tra cứu danh sách nhóm' trước khi nộp bài!");
                  return;
                }
                if (confirm("Bạn có chắc muốn gửi đáp án của nhóm?")) {
                  socket?.emit("group_submit", { code: sessionCode, activityId: activity.activityId, groupId: groupInfo.id, answer: selectedAnswers });
                }
              }}
              disabled={isLocked || workspaceStatus === "SUBMITTED" || !groupInfo}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white flex items-center justify-center transition-all ${
                workspaceStatus === "SUBMITTED" 
                  ? "bg-green-500" 
                  : (isLocked || !groupInfo)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-md transform hover:-translate-y-1"
              }`}
            >
              {workspaceStatus === "SUBMITTED" ? (
                <>
                  <CheckCircle className="mr-2 h-6 w-6" /> Nhóm đã gửi
                </>
              ) : isLocked ? (
                <>
                  <CheckCircle className="mr-2 h-6 w-6" /> Đã khóa
                </>
              ) : !groupInfo ? (
                <>
                  <Users className="mr-2 h-6 w-6" /> Chọn nhóm để nộp bài
                </>
              ) : (
                <>
                  <Send className="mr-2 h-6 w-6" /> Gửi đáp án nhóm
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
