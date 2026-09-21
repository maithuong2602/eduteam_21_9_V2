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

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=eduteam_backup_${Date.now()}.zip`,
      },
    });
  } catch (error: any) {
    console.error('Backup Error:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo sao lưu' }, { status: 500 });
  }
}