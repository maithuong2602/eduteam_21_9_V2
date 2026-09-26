import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { jsonDb } from '@/lib/jsonDb';

export async function POST(request: Request) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Upload Error: Cloudinary environment variables are missing');
      return NextResponse.json(
        { error: 'Server configuration error: Cloudinary credentials missing' },
        { status: 500 }
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

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
    const publicId = (uploadResult as any).public_id || `pres_${Date.now()}`;

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

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload presentation' },
      { status: 500 }
    );
  }
}