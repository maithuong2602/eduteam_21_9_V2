const archiver = require('archiver');
const fs = require('fs');

const output = fs.createWriteStream('C:/DuAn/tuongtac_19_9.zip');
const archive = archiver.create('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.pipe(output);

// append files from a sub-directory, putting its contents at the root of archive
archive.glob('**/*', {
  cwd: 'C:/DuAn/eduteam',
  ignore: ['node_modules/**', '.next/**']
});

archive.finalize();
