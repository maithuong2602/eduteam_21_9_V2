const fs = require('fs');
let content = fs.readFileSync('src/app/globals.css', 'utf8');
content += `

/* Vô hiệu hóa mọi làm mờ của trình duyệt */
select, option, input {
  color: #000 !important;
  opacity: 1 !important;
  font-weight: 800 !important;
  -webkit-text-fill-color: #000 !important;
}
`;
fs.writeFileSync('src/app/globals.css', content);
console.log('Added global override');
