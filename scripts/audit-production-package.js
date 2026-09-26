const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARCHIVE_PATH = process.env.OUTPUT_ARCHIVE || 'G:\\My Drive\\Data\\EDUTEAM_VPS_DEPLOY_2026_09_26.tar.gz';

console.log('=== [AUDIT: PRODUCTION PACKAGE] ===');
console.log(`Checking archive at: ${ARCHIVE_PATH}`);

// 1. Re-build package if requested or if missing
const excludeFlags = [
  '--exclude=".env*"',
  '--exclude="drive_credentials.b64"',
  '--exclude="*.pem"',
  '--exclude="*.key"',
  '--exclude="*.backup"',
  '--exclude="*.bak"',
  '--exclude="*.tmp"',
  '--exclude="*.log"',
  '--exclude="node_modules"',
  '--exclude=".next"',
  '--exclude=".git"',
  '--exclude="test-results"',
  '--exclude="playwright-report"',
  '--exclude="temp_test_migration"',
  '--exclude="EDUTEAM_VPS_DEPLOY_*.tar.gz"'
].join(' ');

console.log('1. Packing clean production package...');
try {
  execSync(`tar ${excludeFlags} -czf "${ARCHIVE_PATH}" .`, { stdio: 'inherit' });
} catch (err) {
  console.error('Failed to create archive:', err.message);
  process.exit(1);
}

// 2. List all files in archive
console.log('2. Inspecting archive file list...');
let fileListRaw = '';
try {
  fileListRaw = execSync(`tar -tf "${ARCHIVE_PATH}"`, { encoding: 'utf8' });
} catch (err) {
  console.error('Failed to list files in archive:', err.message);
  process.exit(1);
}

const entries = fileListRaw.split(/\r?\n/).filter(Boolean);
console.log(`Total entries in archive: ${entries.length}`);

// 3. Check for forbidden file patterns
const FORBIDDEN_PATTERNS = [
  /\.env(\..+)?$/i,
  /drive_credentials\.b64/i,
  /\.(pem|key)$/i,
  /(^|\/|\\)node_modules(\/|\\)/i,
  /(^|\/|\\)\.git(\/|\\)/i,
  /(^|\/|\\)\.next(\/|\\)/i,
  /\.(backup|bak|tmp|log)$/i,
  /(^|\/|\\)test-results(\/|\\)/i
];

const violations = [];

for (const entry of entries) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(entry)) {
      violations.push(`Forbidden entry detected: ${entry} (matched pattern: ${pattern})`);
    }
  }
}

// 4. Scan files for embedded private keys and secret strings in codebase
console.log('3. Scanning source files for secret leaks...');
const sensitiveKeywords = [
  'i5jbdpzg',
  '569753364163795',
  '_1vx6_pU_G8FGdvrYaQuNoq4ewc',
  '-----BEGIN PRIVATE KEY-----',
  '-----BEGIN RSA PRIVATE KEY-----'
];

function scanDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.name === 'node_modules' || item.name === '.git' || item.name === '.next' || item.name === 'drive_credentials.b64') {
      continue;
    }
    if (item.isDirectory()) {
      scanDir(fullPath);
    } else if (item.isFile() && /\.(js|ts|tsx|json|mjs|sh)$/i.test(item.name)) {
      if (item.name === 'audit-production-package.js') continue; // skip self
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const kw of sensitiveKeywords) {
        if (content.includes(kw)) {
          violations.push(`Secret leak detected in ${fullPath}: contains keyword "${kw.substring(0, 10)}..."`);
        }
      }
    }
  }
}

scanDir(process.cwd());

if (violations.length > 0) {
  console.error('\n❌ AUDIT FAILED! The following security violations were found:');
  violations.forEach(v => console.error(` - ${v}`));
  process.exit(1);
}

console.log('\n✅ AUDIT PASSED! Production package is clean, secure, and ready.');
console.log(`Package location: ${ARCHIVE_PATH}`);
