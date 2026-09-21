const fs = require('fs');

const backupCode = `
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ error: 'Thư mục data không tồn tại' }, { status: 404 });
    }

    const zip = new AdmZip();
    zip.addLocalFolder(dataDir);
    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': \`attachment; filename=eduteam_backup_\${Date.now()}.zip\`,
      },
    });
  } catch (error: any) {
    console.error('Backup Error:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo sao lưu' }, { status: 500 });
  }
}
`;
fs.mkdirSync('src/app/api/backup', { recursive: true });
fs.writeFileSync('src/app/api/backup/route.ts', backupCode.trim());

const restoreCode = `
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as any;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file backup' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);
    
    const dataDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    zip.extractAllTo(dataDir, true); // true = overwrite

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Restore Error:', error);
    return NextResponse.json({ error: 'Lỗi khi phục hồi dữ liệu' }, { status: 500 });
  }
}
`;
fs.mkdirSync('src/app/api/restore', { recursive: true });
fs.writeFileSync('src/app/api/restore/route.ts', restoreCode.trim());

console.log('Created backup and restore APIs');
