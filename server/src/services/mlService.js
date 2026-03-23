const fs = require('fs');
const axios = require('axios');

const CLASS_TO_CATEGORY = {
  pothole: 'pothole',
  damaged_road: 'pothole',
  garbage: 'garbage',
  trash: 'garbage',
  waste: 'garbage',
  broken_streetlight: 'streetlight',
  street_light: 'streetlight',
  water_leak: 'flooding',
  blocked_drain: 'flooding',
  flood: 'flooding',
  damaged_sign: 'infrastructure',
  damaged_building: 'infrastructure',
  graffiti: 'other',
  construction_debris: 'other',
};

function mapRoboflowRawClassToCategory(rawClass) {
  // Roboflow may return verbose class values (not just short tokens).
  const raw = String(rawClass || '').toLowerCase();

  // Exact match first
  if (CLASS_TO_CATEGORY[raw]) return CLASS_TO_CATEGORY[raw];

  // Substring heuristics (robust against verbose Roboflow class names)
  if (raw.includes('pothole') || raw.includes('damaged road') || raw.includes('damaged_road')) return 'pothole';
  if (raw.includes('garbage') || raw.includes('trash') || raw.includes('waste')) return 'garbage';
  if (raw.includes('streetlight') || raw.includes('street_light') || raw.includes('broken_streetlight')) return 'streetlight';
  if (raw.includes('flood') || raw.includes('water_leak') || raw.includes('blocked_drain') || raw.includes('water leak')) return 'flooding';
  if (raw.includes('infrastructure') || raw.includes('damaged_sign') || raw.includes('damaged_building')) return 'infrastructure';

  return 'other';
}

function modelForCategory(userCategory) {
  if (userCategory === 'pothole') return process.env.ROBOFLOW_POTHOLE_MODEL;
  if (userCategory === 'garbage') return process.env.ROBOFLOW_GARBAGE_MODEL;
  if (userCategory === 'flood') return process.env.ROBOFLOW_FLOOD_MODEL;
  if (userCategory === 'streetlight') return process.env.ROBOFLOW_STREETLIGHT_MODEL;
  if (userCategory === 'infrastructure') return process.env.ROBOFLOW_INFRASTRUCTURE_MODEL;
  return process.env.ROBOFLOW_POTHOLE_MODEL || process.env.ROBOFLOW_GARBAGE_MODEL || process.env.ROBOFLOW_STREETLIGHT_MODEL || process.env.ROBOFLOW_FLOOD_MODEL || process.env.ROBOFLOW_INFRASTRUCTURE_MODEL;
}

async function classifyImage({ imagePath, userCategory }) {
  try {
    const apiKey = process.env.ROBOFLOW_API_KEY;
    const modelUrl = modelForCategory(userCategory);
    if (!apiKey || !modelUrl) {
      return { category: 'other', confidence: 0, rawClass: '', detections: [], source: 'none', message: 'Roboflow not configured' };
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await axios.post(`${modelUrl}?api_key=${apiKey}`, base64Image, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
      maxBodyLength: Infinity,
    });

    const preds = Array.isArray(response.data && response.data.predictions) ? response.data.predictions : [];
    if (preds.length === 0) {
      return { category: 'other', confidence: 0, rawClass: '', detections: [], source: 'roboflow', message: 'No detections' };
    }

    const best = preds.reduce((a, b) => ((b.confidence || 0) > (a.confidence || 0) ? b : a), preds[0]);
    const rawClass = best.class || '';
    const confidence = Number(best.confidence || 0);
    const mapped = mapRoboflowRawClassToCategory(rawClass);

    return {
      category: mapped,
      confidence,
      rawClass,
      detections: preds,
      source: 'roboflow',
      message: 'OK',
    };
  } catch (e) {
    return { category: 'other', confidence: 0, rawClass: '', detections: [], source: 'error', message: e.message || 'Roboflow failed' };
  }
}

module.exports = { classifyImage, CLASS_TO_CATEGORY };

