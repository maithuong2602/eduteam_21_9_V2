import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing file ID', { status: 400 });
  }

  try {
    const b64 = require('fs').readFileSync(require('path').join(process.cwd(), 'drive_credentials.b64'), 'utf8');
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    const creds = JSON.parse(decoded.charCodeAt(0) === 0xFEFF ? decoded.slice(1) : decoded);
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    const response = await drive.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'stream' }
    );

    // Convert node stream to web stream for Next.js response
    const stream = new ReadableStream({
      start(controller) {
        (response.data as any).on('data', (chunk: any) => controller.enqueue(chunk));
        (response.data as any).on('end', () => controller.close());
        (response.data as any).on('error', (err: any) => controller.error(err));
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline'
      }
    });
  } catch (error: any) {
    console.error('Drive API Error:', error);
    return new NextResponse('Failed to fetch file from Drive', { status: 500 });
  }
}
