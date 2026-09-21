const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const syncLogic = `
  const isInitialMount = useRef(true);
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
`;

code = code.replace(
  'const params = useParams();',
  'const params = useParams();\n  const isInitialMount = useRef(true);'
);

code = code.replace(
  'const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);',
  'const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);\n' + syncLogic.replace('const isInitialMount = useRef(true);', '')
);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Added autosave');
