import { NextResponse } from 'next/server';
import { parsePptx } from '@/lib/pptxParser';
import fs from 'fs';
import path from 'path';
// We don't import pdfjs-dist directly here because it might cause webpack issues in API routes
// We will just assume a generic page count for MVP or we can use pdfjs-dist if we import properly.
// Let's use dynamic import for pdfjs to avoid build errors.

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isPptx = file.name.toLowerCase().endsWith('.pptx');

    if (!isPdf && !isPptx) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ file .pdf hoặc .pptx' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileId = Math.random().toString(36).substring(7);
    
    let totalSlides = 0;
    let slides = [];

    if (isPdf) {
      // Save PDF to public folder for client-side rendering
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, `${fileId}.pdf`), buffer);
      
      // Since extracting page count robustly in Next.js edge/server requires specific pdfjs config,
      // we'll just set a default for MVP or assume teacher knows. 
      // Actually, we can load it using a lightweight regex to find /Count.
      const bufferString = buffer.toString('binary');
      const countMatch = bufferString.match(/\/Type[\s]*\/Pages[\s]*\/Count[\s]+([0-9]+)/);
      totalSlides = countMatch ? parseInt(countMatch[1], 10) : 50; // Fallback to 50 if regex fails
      
      // Create empty slide structures for PDF
      slides = Array.from({ length: totalSlides }).map((_, i) => ({
        slideNumber: i + 1,
        text: `(Nội dung trang ${i + 1})`
      }));
    } else {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const pptxPath = path.join(uploadDir, `${fileId}.pptx`);
      const pdfPath = path.join(uploadDir, `${fileId}.pdf`);
      
      fs.writeFileSync(pptxPath, buffer);
      
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const psCommand = `$ppt = New-Object -ComObject PowerPoint.Application; $presentation = $ppt.Presentations.Open('${pptxPath}', $true, $false, $false); $presentation.SaveAs('${pdfPath}', 32); $presentation.Close(); $ppt.Quit();`;
      await execPromise(`powershell -Command "${psCommand}"`);
      
      slides = await parsePptx(buffer);
      totalSlides = slides.length;
    }

    return NextResponse.json({ 
      success: true, 
      presentation: {
        id: fileId,
        title: file.name,
        type: isPdf ? 'pdf' : 'pptx',
        fileUrl: `/uploads/${fileId}.pdf`, // Now both PDF and PPTX return a PDF URL
        totalSlides,
        slides
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process presentation' }, { status: 500 });
  }
}
