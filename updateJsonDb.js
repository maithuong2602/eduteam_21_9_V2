const fs = require('fs');
let code = fs.readFileSync('src/lib/jsonDb.ts', 'utf8');

const interfaceRegex = /export interface Presentation \{([\s\S]*?)createdAt: number;/;
const interfaceReplacement = `export interface Presentation {$1slides?: { id: string, fileUrl: string, pageNumber: number }[];\n  createdAt: number;`;
code = code.replace(interfaceRegex, interfaceReplacement);

const getPresentationRegex = /getPresentation: \(id: string\) => \(getDb\(\)\.presentations \|\| \[\]\)\.find\(p => p\.id === id\),/;
const getPresentationReplacement = `getPresentation: (id: string) => {
    const db = getDb();
    const p = (db.presentations || []).find(p => p.id === id);
    if (p && !p.slides) {
      p.slides = Array.from({ length: p.totalSlides || 0 }).map((_, i) => ({
        id: "slide_" + Date.now() + "_" + i,
        fileUrl: p.fileUrl,
        pageNumber: i + 1
      }));
      jsonDb.savePresentation(p);
    }
    return p;
  },`;
code = code.replace(getPresentationRegex, getPresentationReplacement);

fs.writeFileSync('src/lib/jsonDb.ts', code);
console.log('Updated jsonDb.ts for slide array');
