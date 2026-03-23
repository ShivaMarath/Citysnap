const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
}

async function uploadReportImage(localPath) {
  try {
    ensureConfigured();
    if (!configured) throw new Error('Cloudinary not configured');

    const res = await cloudinary.uploader.upload(localPath, {
      folder: 'citysnap/reports',
      resource_type: 'image',
      transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
    });

    try {
      fs.unlinkSync(localPath);
    } catch (e) {
      // ignore
    }

    return { url: res.secure_url, source: 'cloudinary' };
  } catch (e) {
    const filename = path.basename(localPath);
    return { url: `/uploads/${filename}`, source: 'local' };
  }
}

module.exports = { uploadReportImage };

