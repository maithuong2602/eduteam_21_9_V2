import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { getDataDir, getDbFilePath } from '@/lib/dataConfig';

// Allowlist of files permitted to be restored
const ALLOWED_EXCEL_FILES = new Set([
  '02_DANH_SACH_HOC_SINH.xlsx',
  '03_NHOM_HOC_SINH.xlsx',
  '04_HOAT_DONG.xlsx'
]);

const ALLOWED_UPLOAD_EXTS = new Set([
  '.pdf', '.pptx', '.png', '.jpg', '.jpeg', '.webp'
]);

function isSafeEntry(entryName: string): boolean {
  const normalized = path.normalize(entryName).replace(/\\/g, '/');

  // Prevent path traversal
  if (normalized.includes('..') || path.isAbsolute(normalized) || /^[a-zA-Z]:/.test(normalized) || normalized.includes('\0')) {
    return false;
  }

  // Strictly forbidden patterns
  const lower = normalized.toLowerCase();
  if (
    lower.includes('.env') ||
    lower.includes('.git') ||
    lower.includes('credential') ||
    lower.includes('token') ||
    lower.includes('secret') ||
    lower.includes('.key') ||
    lower.includes('.pem') ||
    lower.includes('node_modules') ||
    lower.includes('package.json') ||
    lower.includes('server.js') ||
    lower.startsWith('src/') ||
    lower.endsWith('.js') ||
    lower.endsWith('.ts') ||
    lower.endsWith('.sh') ||
    lower.endsWith('.bak') ||
    lower.endsWith('.tmp')
  ) {
    return false;
  }

  const baseName = path.basename(normalized);

  // Allow db.json or test db
  if (baseName === 'db.json' || baseName === 'db.test.json') {
    return true;
  }

  // Allow registered Excel databases
  if (ALLOWED_EXCEL_FILES.has(baseName)) {
    return true;
  }

  // Allow static files in uploads
  if (normalized.startsWith('uploads/') || normalized.startsWith('data/uploads/')) {
    const ext = path.extname(baseName).toLowerCase();
    return ALLOWED_UPLOAD_EXTS.has(ext);
  }

  return false;
}

export async function POST(req: NextRequest) {
  const targetDataDir = getDataDir();
  const targetDbPath = getDbFilePath();
  const stagingDir = path.join(targetDataDir, `.staging_restore_${Date.now()}`);
  const backups: { original: string; backup: string }[] = [];

  const cleanup = () => {
    try {
      if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      }
      for (const b of backups) {
        if (fs.existsSync(b.backup)) {
          fs.unlinkSync(b.backup);
        }
      }
    } catch (_) {}
  };

  const rollback = () => {
    console.warn('[RESTORE ROLLBACK] An error occurred during restore. Rolling back to previous state...');
    try {
      for (const b of backups) {
        if (fs.existsSync(b.backup)) {
          fs.copyFileSync(b.backup, b.original);
          fs.unlinkSync(b.backup);
        }
      }
      if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      }
    } catch (err: any) {
      console.error('[RESTORE ROLLBACK ERROR]', err?.message);
    }
  };

  try {
    // 1. Authenticate via ADMIN_TOKEN
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) {
      return NextResponse.json({ error: 'System not configured for restore' }, { status: 403 });
    }

    // Explicitly reject query tokens
    if (req.nextUrl.searchParams.get('token')) {
      return NextResponse.json({ error: 'Unauthorized: Query token not allowed' }, { status: 401 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providedToken = authHeader.substring(7).trim();
    if (providedToken !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Read multipart payload
    const formData = await req.formData();
    const file = formData.get('file') as any;

    if (!file) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'Invalid file size' }, { status: 400 });
    }

    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      return NextResponse.json({ error: 'Invalid zip archive' }, { status: 400 });
    }

    const entries = zip.getEntries();
    if (entries.length === 0) {
      return NextResponse.json({ error: 'Empty zip archive' }, { status: 400 });
    }

    // 3. Pre-validate ALL entries before touching any files
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (!isSafeEntry(entry.entryName)) {
        console.warn(`[RESTORE REJECTED] Unsafe entry detected: ${entry.entryName}`);
        return NextResponse.json(
          { error: 'Archive contains forbidden or unsafe files' },
          { status: 400 }
        );
      }
    }

    // 4. ATOMIC STAGING PHASE: Extract to staging directory first
    if (!fs.existsSync(targetDataDir)) {
      fs.mkdirSync(targetDataDir, { recursive: true });
    }
    fs.mkdirSync(stagingDir, { recursive: true });

    const plannedMoves: { stagingFile: string; destFile: string }[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const baseName = path.basename(entry.entryName);
      let destPath: string;

      if (baseName === 'db.json' || baseName === 'db.test.json') {
        destPath = targetDbPath;
      } else if (ALLOWED_EXCEL_FILES.has(baseName)) {
        destPath = path.join(targetDataDir, baseName);
      } else if (entry.entryName.includes('uploads/')) {
        const uploadsDir = path.join(targetDataDir, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        destPath = path.join(uploadsDir, baseName);
      } else {
        continue;
      }

      // Path Traversal Sanity Check
      const resolvedDest = path.resolve(destPath);
      const resolvedTargetDir = path.resolve(targetDataDir);
      const resolvedDbPath = path.resolve(targetDbPath);
      if (!resolvedDest.startsWith(resolvedTargetDir) && resolvedDest !== resolvedDbPath) {
        cleanup();
        return NextResponse.json({ error: 'Path traversal validation failed' }, { status: 400 });
      }

      // Write to isolated staging first
      const stagedFilePath = path.join(stagingDir, `staged_${plannedMoves.length}_${baseName}`);
      fs.writeFileSync(stagedFilePath, entry.getData());

      // If it is a db.json, verify that it is valid JSON
      if (baseName === 'db.json' || baseName === 'db.test.json') {
        try {
          JSON.parse(fs.readFileSync(stagedFilePath, 'utf8'));
        } catch {
          cleanup();
          return NextResponse.json({ error: 'Database JSON file in archive is corrupted' }, { status: 400 });
        }
      }

      plannedMoves.push({ stagingFile: stagedFilePath, destFile: resolvedDest });
    }

    // 5. BACKUP PHASE: Snapshot existing files before applying replacement
    for (const move of plannedMoves) {
      if (fs.existsSync(move.destFile)) {
        const backupPath = `${move.destFile}.rollback_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        fs.copyFileSync(move.destFile, backupPath);
        backups.push({ original: move.destFile, backup: backupPath });
      }
    }

    // 6. ATOMIC COMMIT PHASE: Move all staged files into destinations
    try {
      for (const move of plannedMoves) {
        fs.copyFileSync(move.stagingFile, move.destFile);
      }
    } catch (commitErr) {
      rollback();
      throw commitErr;
    }

    // 7. Cleanup staging and rollback files on success
    cleanup();

    return NextResponse.json({
      success: true,
      restoredCount: plannedMoves.length,
      atomicReplacement: true
    });
  } catch (error: any) {
    rollback();
    console.error('Restore Error:', error?.message || 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}