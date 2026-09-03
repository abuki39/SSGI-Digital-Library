const cloudinary = require('cloudinary').v2;
const fileUrl = 'https://res.cloudinary.com/demo/raw/upload/v1612345678/ssgi_secure_docs/test_doc.pdf';

const urlObj = new URL(fileUrl);
const pathParts = urlObj.pathname.split('/');
const uploadIndex = pathParts.indexOf('upload');

let publicIdParts = pathParts.slice(uploadIndex + 1);
if (publicIdParts[0].match(/^v\d+$/)) {
    publicIdParts.shift();
}
const publicId = decodeURIComponent(publicIdParts.join('/'));

console.log('Public ID:', publicId);

const signedUrl = cloudinary.url(publicId, { sign_url: true, secure: true, resource_type: 'raw' });
console.log('Signed URL:', signedUrl);
