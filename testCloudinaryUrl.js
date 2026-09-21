const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: 'i5jbdpzg',
  api_key: '569753364163795',
  api_secret: '_1vx6_pU_G8FGdvrYaQuNoq4ewc'
});

const url = cloudinary.url('yhcn7dr08sdqgr3ynag4.pdf', { resource_type: 'raw', sign_url: true });
console.log(url);
