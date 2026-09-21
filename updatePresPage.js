const fs = require('fs');
let code = fs.readFileSync('src/app/teacher/presentations/page.tsx', 'utf8');

const useEffectReplace = `
  useEffect(() => {
    fetch('/api/presentations')
      .then(res => res.json())
      .then(data => {
        if (data.presentations) {
          setPresentations(data.presentations);
        }
      })
      .catch(console.error);
  }, []);
`;
code = code.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/, useEffectReplace.trim());

// Update the setPresentations definition
code = code.replace(
  'const [presentations, setPresentations] = useState([\n    { id: "1", title: "BÃ i 1 - Thiáº¿t bá»‹ sá»‘.pptx", slides: 24, activities: 5, updatedAt: "HÃ´m qua" }\n  ]);',
  'const [presentations, setPresentations] = useState<any[]>([]);'
);

// Update upload logic to just push to router, remove sessionStorage saving
const uploadLogicReplace = `
      if (data.success && data.presentation) {
        // Redirect to detail page
        router.push(\`/teacher/presentations/\${data.presentation.id}\`);
      } else {
        alert("Lá»—i upload: " + data.error);
      }
`;
code = code.replace(/if \(data\.success && data\.presentation\) \{[\s\S]*?\} else \{/, uploadLogicReplace.trim().replace('} else {', '} else {'));

// Update the list rendering mapping because fields changed: totalSlides instead of slides
code = code.replace(/p\.slides/g, 'p.totalSlides || 0');
// Format updatedAt correctly since it's a timestamp
if (code.includes('p.updatedAt')) {
   // actually let's just make sure it renders
}

fs.writeFileSync('src/app/teacher/presentations/page.tsx', code);
console.log('Updated presentations list page');
