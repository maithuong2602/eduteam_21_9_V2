const path = require('path');
const fs = require('fs');

function isTestMode() {
  return process.env.USE_TEST_DB === 'true';
}

function getDataDir() {
  if (isTestMode()) {
    return path.join(process.cwd(), 'src', 'data');
  }
  if (process.env.EDUTEAM_DATA_DIR) {
    return path.resolve(process.env.EDUTEAM_DATA_DIR);
  }
  if (process.env.DB_FILE) {
    return path.dirname(path.resolve(process.env.DB_FILE));
  }
  return path.join(process.cwd(), 'src', 'data');
}

function getDbFilePath() {
  if (isTestMode()) {
    return path.join(process.cwd(), 'src', 'data', 'db.test.json');
  }
  if (process.env.DB_FILE) {
    return path.resolve(process.env.DB_FILE);
  }
  return path.join(process.cwd(), 'src', 'data', 'db.json');
}

function getExcelPath(filename) {
  const customDataDir = getDataDir();
  const customPath = path.join(customDataDir, filename);
  if (fs.existsSync(customPath)) {
    return customPath;
  }
  // Fallback to default source data directory if file does not exist in custom directory
  const fallbackPath = path.join(process.cwd(), 'src', 'data', filename);
  return fallbackPath;
}

module.exports = {
  get isTest() {
    return isTestMode();
  },
  isTestMode,
  getDataDir,
  getDbFilePath,
  getExcelPath
};
