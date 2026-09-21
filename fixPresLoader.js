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
               const actsObj = {};
               const slideActsObj = {};
               data.activities.forEach(act => {
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
    
    // Setup socket
    const newSocket = io(undefined);
`;

code = code.replace(
  /useEffect\(\(\) => \{\s*\/\/\s*Basic mock data for id "1"[\s\S]*?\/\/\s*Setup socket\s*const newSocket = io\(undefined\);/,
  loadPresReplace.trim()
);

fs.writeFileSync('src/app/teacher/presentations/[id]/page.tsx', code);
console.log('Fixed presentation loader to use API');
