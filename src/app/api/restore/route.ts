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