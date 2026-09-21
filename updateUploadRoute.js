const fs = require('fs');
let code = fs.readFileSync('src/app/api/upload/route.ts', 'utf8');

if (!code.includes("import { jsonDb }")) {
  code = code.replace("import { v2 as cloudinary } from 'cloudinary';", "import { v2 as cloudinary } from 'cloudinary';\nimport { jsonDb } from '@/lib/jsonDb';");
}

const replacement = `
    const presentationData = {
        id: publicId,
        teacherId: 'teacher_1', // Using default
        title: file.name.replace('.pdf', '').replace('.pptx', ''),
        originalFileName: file.name,
        totalSlides: (uploadResult as any).pages || 1,
        fileUrl: downloadURL,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    jsonDb.savePresentation(presentationData);

    // Must return the exact format expected by frontend
    return NextResponse.json({
      success: true,
      presentation: presentationData
    });
`;

code = code.replace(
  /\/\/ Must return the exact format expected by frontend[\s\S]*?\}\);/g,
  replacement.trim()
);

fs.writeFileSync('src/app/api/upload/route.ts', code);
console.log('Updated upload route to save presentation');
