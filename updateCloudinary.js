const fs = require('fs');

const uploadCode = `
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with the user's credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
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
          resource_type: 'image', // 'image' handles PDFs beautifully on Cloudinary
          format: 'pdf',
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

    // Return proxy URL to ensure absolutely zero CORS issues with PDF.js
    return NextResponse.json({
      success: true,
      fileUrl: \`/api/proxy?url=\${encodeURIComponent(downloadURL)}\`,
      id: (uploadResult as any).public_id
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
console.log('Updated upload/route.ts for Cloudinary');
