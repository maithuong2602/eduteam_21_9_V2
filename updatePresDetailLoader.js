const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/[id]/page.tsx', 'utf8');

const loadPresReplace = `
  useEffect(() => {
    if (id === "1") {
      setPresentation({
        id: "1",
        title: "BÃ i 1: Giá»›i thiá»‡u chung",
        totalSlides: 12,
        type: 'pptx',
        slides: Array.from({ length: 12 }).map((_, i) => ({
          slideNumber: i + 1,
          text: \`Ná»™i dung demo cá»§a slide \${i + 1}\\n\\nÄ Ã¢y lÃ  trÃ­ch xuáº¥t vÄƒn báº£n tá»« PowerPoint. GiÃ¡o viÃªn cÃ³ thá»ƒ xem trÆ°á»›c ná»™i dung á»Ÿ Ä‘Ã¢y.\`
        }))
      });
      setActivities({
        3: { type: "MULTIPLE_CHOICE" },
        5: { type: "SHORT_ANSWER" },
      });
      setSelectedSlide(3);
    } else {
      fetch(\`/api/presentations/\${id}\`)
        .then(res => res.json())
        .then(data => {
          if (data.presentation) {
            setPresentation(data.presentation);
            setSelectedSlide(1);
            if (data.activities && data.activities.length > 0) {
               // Load activities into the state
               const actsObj: any = {};
               const slideActsObj: any = {};
               data.activities.forEach((act: any) => {
                 actsObj[act.id] = act;
                 if (!slideActsObj[act.slideId]) slideActsObj[act.slideId] = [];
                 slideActsObj[act.slideId].push(act.id);
               });
               setActivities(actsObj);
               setSlideActivities(slideActsObj);
            }
          }
        })
        .catch(console.error);
    }
`;

code = code.replace(/useEffect\(\(\) => \{\s*\/\/\s*Basic mock data for id "1"[\s\S]*?\}\s*else\s*\{[\s\S]*?\}\s*\}/, loadPresReplace.trim());

// Also, when an activity is created or updated, we should POST to /api/activities
// Let's find handleSaveConfig
const autosaveLogic = `
  const handleSaveConfig = () => {
    if (currentActivityId) {
      const act = activities[currentActivityId];
      if (act) {
         fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               ...act,
               presentationId: id,
               slideId: selectedSlide,
               updatedAt: Date.now()
            })
         }).catch(console.error);
      }
    }
    setShowConfigModal(false);
  };
`;
// Actually, let's just find where setShowConfigModal(false) happens after save.
// Let's first search for handleSaveConfig or how it saves.
fs.writeFileSync('updatePresDetail.js', '// Wait, need to see handleSaveConfig');
