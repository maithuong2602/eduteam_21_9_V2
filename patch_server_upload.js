const fs = require('fs');
const file = 'server.js';
let content = fs.readFileSync(file, 'utf8');

const uploadRoutes = `
  // Temporary storage routes for student submissions
  const multer = require('multer');
  const archiver = require('archiver');
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(process.cwd(), 'public', 'uploads', 'submissions', req.body.sessionCode || 'default', req.body.activityId || 'default');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const studentId = req.body.studentId || 'unknown';
      const studentName = req.body.studentName || studentId;
      const safeName = studentName.replace(/[^a-z0-9]/gi, '_');
      const ext = path.extname(file.originalname);
      cb(null, safeName + '_' + Date.now() + ext);
    }
  });
  const upload = multer({ storage: storage });

  app.post('/api/upload_submission', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { sessionCode, activityId } = req.body;
    const fileUrl = '/uploads/submissions/' + sessionCode + '/' + activityId + '/' + req.file.filename;
    
    res.json({ 
      success: true, 
      url: fileUrl, 
      size: req.file.size,
      filename: req.file.filename,
      originalName: req.file.originalname,
      timestamp: Date.now()
    });
  });

  app.get('/api/download_submissions/:sessionCode/:activityId', (req, res) => {
    const { sessionCode, activityId } = req.params;
    const dir = path.join(process.cwd(), 'public', 'uploads', 'submissions', sessionCode, activityId);
    
    if (!fs.existsSync(dir)) {
      return res.status(404).send('No submissions found');
    }

    res.attachment('submissions_' + sessionCode + '_' + activityId + '.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', function(err) {
      res.status(500).send({error: err.message});
    });
    
    archive.pipe(res);
    archive.directory(dir, false);
    archive.finalize();
  });
`;

if (!content.includes('/api/upload_submission')) {
  content = content.replace(
    "app.post('/api/internal/force_sync_groups', require('express').json(), (req, res) => {",
    uploadRoutes + "\n  app.post('/api/internal/force_sync_groups', require('express').json(), (req, res) => {"
  );
  fs.writeFileSync(file, content);
  console.log('Success - Added upload routes');
} else {
  console.log('Routes already exist');
}
