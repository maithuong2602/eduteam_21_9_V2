const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '  const [groupInfo, setGroupInfo] = useState<any>(null);\n  const [availableGroups, setAvailableGroups] = useState<any[]>([]);\n  const [selectedViewGroup, setSelectedViewGroup] = useState<any>(null);',
  '  const [groupInfo, setGroupInfo] = useState<any>(null);\n  const [availableGroups, setAvailableGroups] = useState<any[]>([]);\n  const [systemId, setSystemId] = useState<string>("");\n  const [selectedViewGroup, setSelectedViewGroup] = useState<any>(null);'
);

content = content.replace(
  '  useEffect(() => {\n    const name = sessionStorage.getItem("eduteam_student_name");',
  '  useEffect(() => {\n    const myId = systemId || studentName;\n    if (availableGroups && availableGroups.length > 0 && myId) {\n      const myGroup = availableGroups.find((g: any) => g.members.some((m: any) => String(m.studentId).trim().toUpperCase() === String(myId).trim().toUpperCase()));\n      if (myGroup) setGroupInfo(myGroup);\n      else setGroupInfo(null);\n    } else {\n      setGroupInfo(null);\n    }\n  }, [availableGroups, systemId, studentName]);\n\n  useEffect(() => {\n    const name = sessionStorage.getItem("eduteam_student_name");'
);

content = content.replace(
  '      if (data.realName) setRealStudentName(data.realName);\n      if (data.activityConfig) {',
  '      if (data.realName) setRealStudentName(data.realName);\n      if (data.systemId) setSystemId(data.systemId);\n      if (data.activityConfig) {'
);

const regex = /    newSocket\.on\("groups_updated"[\s\S]*?    newSocket\.on\("group_created", \(groups: any\[\]\) => \{\n      setAvailableGroups\(groups\);\n      const myId = name;\n      const myGroup = groups\.find\(\(g: any\) => g\.members\.some\(\(m: any\) => String\(m\.studentId\)\.trim\(\)\.toUpperCase\(\) === String\(myId\)\.trim\(\)\.toUpperCase\(\)\)\);\n      if \(myGroup\) setGroupInfo\(myGroup\);\n      else setGroupInfo\(null\);\n    \}\);/g;

content = content.replace(regex, '    newSocket.on("groups_updated", (groups: any[]) => {\n      setAvailableGroups(groups);\n    });\n    newSocket.on("group_member_joined", (groups: any[]) => {\n      setAvailableGroups(groups);\n    });\n    newSocket.on("group_member_left", (groups: any[]) => {\n      setAvailableGroups(groups);\n    });\n    newSocket.on("group_created", (groups: any[]) => {\n      setAvailableGroups(groups);\n    });');

fs.writeFileSync(file, content);
