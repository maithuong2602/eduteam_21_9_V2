const fs = require('fs');

const uploadCode = `
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with the user's credentials
cloudinary.config({
  cloud_name: 'i5jbdpzg',
  api_key: '569753364163795',
  api_secret: '_1vx6_pU_G8FGdvrYaQuNoq4ewc'
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as any;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          resource_type: 'auto', // use auto so Cloudinary handles it perfectly
          access_mode: 'public'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const downloadURL = (uploadResult as any).secure_url;
    const publicId = (uploadResult as any).public_id || \`pres_\${Date.now()}\`;

    // Must return the exact format expected by frontend
    return NextResponse.json({
      success: true,
      presentation: {
        id: publicId,
        title: file.name.replace('.pdf', ''),
        totalSlides: (uploadResult as any).pages || 1,
        fileUrl: downloadURL
      }
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to Cloudinary', details: error.message || error.toString() },
      { status: 500 }
    );
  }
}
`;
fs.writeFileSync('src/app/api/upload/route.ts', uploadCode.trim());
console.log('Fixed syntax error');
