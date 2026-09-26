const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const url = cloudinary.url('yhcn7dr08sdqgr3ynag4.pdf', { resource_type: 'raw', sign_url: true });
console.log(url);
