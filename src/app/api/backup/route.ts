import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { getDataDir, getDbFilePath } from '@/lib/dataConfig';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify ADMIN_TOKEN configuration
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) {
      return NextResponse.json({ error: 'System not configured for secure backup' }, { status: 403 });
    }

    // 2. Reject query token explicitly
    if (req.nextUrl.searchParams.get('token')) {
      return NextResponse.json({ error: 'Unauthorized: Query token not allowed' }, { status: 401 });
    }

    // 3. Strict Bearer token check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providedToken = authHeader.substring(7).trim();
    if (providedToken !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zip = new AdmZip();
    
    // Filter out unsafe, temporary, or sensitive files
    const shouldIncludeFile = (filename: string) => {
      const lower = filename.toLowerCase();
      if (lower.includes('.env') || lower.includes('credential') || lower.includes('token') || lower.includes('private') || lower.includes('.key') || lower.includes('.pem')) return false;
      if (lower.endsWith('.tmp') || lower.endsWith('.bak') || lower.endsWith('.backup')) return false;
      if (lower.includes('node_modules') || lower.includes('.git')) return false;
      if (lower === 'db.test.json' && process.env.USE_TEST_DB !== 'true') return false;
      return true;
    };

    const dataDir = getDataDir();
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      for (const file of files) {
        if (shouldIncludeFile(file)) {
          const filePath = path.join(dataDir, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            zip.addLocalFile(filePath, 'data');
          }
        }
      }
    }

    const currentDbFile = getDbFilePath();
    if (fs.existsSync(currentDbFile) && shouldIncludeFile(path.basename(currentDbFile))) {
      const inDataDir = currentDbFile.startsWith(dataDir);
      if (!inDataDir) {
        zip.addLocalFile(currentDbFile);
      }
    }
    
    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=eduteam_backup_${Date.now()}.zip`,
      },
    });
  } catch (error: any) {
    console.error('Backup Error:', error?.message || 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}