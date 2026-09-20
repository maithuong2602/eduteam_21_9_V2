import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';

export interface ParsedSlide {
  slideNumber: number;
  text: string;
}

export async function parsePptx(buffer: Buffer): Promise<ParsedSlide[]> {
  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries();
  
  // Find all slide xml files
  const slideEntries = zipEntries.filter(
    (entry) => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')
  );

  const slides: ParsedSlide[] = [];

  for (const entry of slideEntries) {
    // Extract slide number from filename (e.g., slide1.xml -> 1)
    const match = entry.entryName.match(/slide(\d+)\.xml$/);
    if (!match) continue;
    
    const slideNumber = parseInt(match[1], 10);
    const xmlData = entry.getData().toString('utf8');
    
    try {
      const result = await parseStringPromise(xmlData);
      const textTexts = extractTextFromShape(result);
      
      slides.push({
        slideNumber,
        text: textTexts.join('\n\n')
      });
    } catch (e) {
      console.error(`Error parsing slide ${slideNumber}`, e);
    }
  }

  // Sort by slide number
  slides.sort((a, b) => a.slideNumber - b.slideNumber);
  
  return slides;
}

// Find all <a:p> elements and extract text from their <a:t> children
function extractTextFromShape(obj: any): string[] {
  let paragraphs: string[] = [];
  
  if (typeof obj === 'string') {
    return [];
  }
  
  // If this object is an array, map over it
  if (Array.isArray(obj)) {
    for (const item of obj) {
      paragraphs = paragraphs.concat(extractTextFromShape(item));
    }
    return paragraphs;
  }
  
  for (const key in obj) {
    if (key === 'a:p') {
      // This is a paragraph. We need to extract all text inside it and join with space/empty.
      const pArray = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
      for (const p of pArray) {
        const textRuns = extractAllText(p);
        const paragraphText = textRuns.join('').trim();
        if (paragraphText) {
          paragraphs.push(paragraphText);
        }
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      paragraphs = paragraphs.concat(extractTextFromShape(obj[key]));
    }
  }
  return paragraphs;
}

// Helper to deeply extract all <a:t> values within a paragraph object
function extractAllText(obj: any): string[] {
  let texts: string[] = [];
  if (typeof obj === 'string') {
    return [];
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      texts = texts.concat(extractAllText(item));
    }
    return texts;
  }
  for (const key in obj) {
    if (key === 'a:t') {
      const tVal = obj[key];
      if (Array.isArray(tVal)) {
        texts = texts.concat(tVal.filter((t: any) => typeof t === 'string'));
      } else if (typeof tVal === 'string') {
        texts.push(tVal);
      } else if (typeof tVal === 'object' && tVal._) {
        texts.push(tVal._);
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      texts = texts.concat(extractAllText(obj[key]));
    }
  }
  return texts;
}
