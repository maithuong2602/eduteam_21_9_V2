const fs = require('fs');

const proxyCode = `
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from remote' }, { status: response.status });
    }

    // Convert fetch body to ReadableStream
    const readable = response.body;
    
    if (!readable) {
        return NextResponse.json({ error: 'No response body' }, { status: 500 });
    }

    return new NextResponse(readable as any, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/pdf',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

  } catch (error: any) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy file', details: (error as Error).message },
      { status: 500 }
    );
  }
}
`;
fs.mkdirSync('src/app/api/proxy', { recursive: true });
fs.writeFileSync('src/app/api/proxy/route.ts', proxyCode.trim());
console.log('Created proxy route');
