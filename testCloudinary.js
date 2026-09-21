const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: 'i5jbdpzg',
  api_key: '569753364163795',
  api_secret: '_1vx6_pU_G8FGdvrYaQuNoq4ewc'
});

async function test() {
  const result = await cloudinary.uploader.upload('test.pdf', { resource_type: 'raw' });
  console.log(result.secure_url);
}
test().catch(console.error);
