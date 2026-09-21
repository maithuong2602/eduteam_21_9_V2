const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewer.tsx', 'utf8');

code = code.replace(
  'pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;',
  'pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;'
);

fs.writeFileSync('src/components/PdfViewer.tsx', code);
console.log('Updated PdfViewer worker to cdnjs');
