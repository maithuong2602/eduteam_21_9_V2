import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

import fs from 'fs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing file ID', { status: 400 });
  }

  try {
    let creds: any = null;

    // 1. Check direct Base64 env variable
    if (process.env.GOOGLE_CREDENTIALS_B64) {
      const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, 'base64').toString('utf8');
      creds = JSON.parse(decoded.charCodeAt(0) === 0xFEFF ? decoded.slice(1) : decoded);
    } 
    // 2. Check external secret file path
    else {
      const credsPath = process.env.GOOGLE_CREDENTIALS_PATH 
        || (process.env.NODE_ENV === 'production' 
          ? '/var/lib/eduteam/secrets/drive_credentials.b64' 
          : path.join(process.cwd(), 'drive_credentials.b64'));

      if (fs.existsSync(credsPath)) {
        const fileContent = fs.readFileSync(credsPath, 'utf8').trim();
        // Determine if file is JSON or Base64
        if (fileContent.startsWith('{')) {
          creds = JSON.parse(fileContent);
        } else {
          const decoded = Buffer.from(fileContent, 'base64').toString('utf8');
          creds = JSON.parse(decoded.charCodeAt(0) === 0xFEFF ? decoded.slice(1) : decoded);
        }
      }
    }

    if (!creds) {
      console.warn('[DRIVE API] Google Drive integration not configured.');
      return new NextResponse('Google Drive integration not configured on this server', { status: 503 });
    }

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
    console.error('Drive API Error:', error?.message || 'Unknown error');
    return new NextResponse('Failed to fetch file from Drive', { status: 500 });
  }
}
