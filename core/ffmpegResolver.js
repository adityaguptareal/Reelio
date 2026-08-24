const fs = require('fs');
const path = require('path');

function resolveFfmpegPath() {
  const root = path.resolve(__dirname, '..');
  const platform = process.platform;
  const candidates = [];

  if (platform === 'win32') {
    candidates.push(path.join(root, 'ffmpeg', 'win32', 'ffmpeg.exe'));
  }

  if (platform === 'darwin') {
    candidates.push(path.join(root, 'ffmpeg', 'macos', 'ffmpeg'));
  }

  if (platform === 'linux') {
    candidates.push(path.join(root, 'ffmpeg', 'linux', 'ffmpeg'));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic) {
      return ffmpegStatic;
    }
  } catch (error) {
    // fall through
  }

  return 'ffmpeg';
}

module.exports = { resolveFfmpegPath };
