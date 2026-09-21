import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import stream from 'stream';
import path from 'path';

const FOLDER_ID = '1zFYWfm4SRpdNWlAjFJmjLqzEb7a9jJGX';

// Authenticate with Google
const getDriveService = () => {
  const b64 = require('fs').readFileSync(require('path').join(process.cwd(), 'drive_credentials.b64'), 'utf8');
  const creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return NextResponse.json({ error: 'Hệ thống hiện tại chỉ hỗ trợ file PDF. Vui lòng chuyển đổi sang PDF trước khi tải lên!' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Google Drive
    const drive = getDriveService();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const driveRes = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [FOLDER_ID],
        mimeType: 'application/pdf'
      },
      media: {
        mimeType: 'application/pdf',
        body: bufferStream
      },
      fields: 'id, name, webViewLink'
    });

    const fileId = driveRes.data.id as string;

    // Make the file readable by anyone
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      }
    });

    // Parse page count (fallback to basic regex)
    const bufferString = buffer.toString('binary');
    const countMatch = bufferString.match(/\/Type[\s]*\/Pages[\s]*\/Count[\s]+([0-9]+)/);
    const totalSlides = countMatch ? parseInt(countMatch[1], 10) : 50;
    
    const slides = Array.from({ length: totalSlides }).map((_, i) => ({
      slideNumber: i + 1,
      text: `(Nội dung trang ${i + 1})`
    }));

    return NextResponse.json({ 
      success: true, 
      presentation: {
        id: fileId,
        title: file.name,
        type: 'pdf',
        fileUrl: `/api/drive?id=${fileId}`, 
        totalSlides,
        slides
      }
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload to Google Drive', details: error.message }, { status: 500 });
  }
}
