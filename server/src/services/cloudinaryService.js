const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const hasAll = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  if (hasAll) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  } else {
    console.warn('[Cloudinary] Missing CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET. Using local upload fallback.');
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
    console.warn(`[Cloudinary] Upload failed for ${filename}. Falling back to local storage. Reason: ${e.message || 'unknown error'}`);
    return { url: `/uploads/${filename}`, source: 'local', error: e.message || 'upload failed' };
  }
}

module.exports = { uploadReportImage };

