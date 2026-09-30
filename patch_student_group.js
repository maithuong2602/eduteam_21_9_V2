const fs = require('fs');
const file = 'src/app/student/[sessionCode]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add systemId state
content = content.replace(
  'const [availableGroups, setAvailableGroups] = useState<any[]>([]);',
  'const [availableGroups, setAvailableGroups] = useState<any[]>([]);\n    const [systemId, setSystemId] = useState<string>("");'
);

// Update join_success
content = content.replace(
  'if (data.realName) setRealStudentName(data.realName);',
  'if (data.realName) setRealStudentName(data.realName);\n          if (data.systemId) setSystemId(data.systemId);\n          if (data.groups) setAvailableGroups(data.groups);'
);

// Add useEffect
const useEffectCode = `\n    useEffect(() => {
      if (!systemId || availableGroups.length === 0) {
        setGroupInfo(null);
        return;
      }
      const myGroup = availableGroups.find(g => g.members.some((m:any) => String(m.studentId) === String(systemId)));
      setGroupInfo(myGroup || null);
    }, [systemId, availableGroups]);\n`;

content = content.replace(
  'useEffect(() => {\n      if (activity?.mode === \'GROUP\' && groupInfo)',
  useEffectCode + '\n    useEffect(() => {\n      if (activity?.mode === \'GROUP\' && groupInfo)'
);

fs.writeFileSync(file, content);
