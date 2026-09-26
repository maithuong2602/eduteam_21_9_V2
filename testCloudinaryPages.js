const { v2: cloudinary } = require('cloudinary');
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
async function test() {
  const result = await cloudinary.uploader.upload('real.pdf', { resource_type: 'auto' });
  console.log(Object.keys(result));
  console.log("PAGES:", result.pages);
}
test().catch(console.error);
