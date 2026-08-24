const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function createDirectory(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

function getHookFiles(folder) {
  return fs.readdirSync(folder)
    .filter((file) => file.toLowerCase().endsWith('.mp4'))
    .sort();
}

function escapeDrawText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\r?\n/g, '\\n');
}

function buildFfmpegArgs(hookPath, demoPath, audioPath, outputPath, caption) {
  const safeCaption = escapeDrawText(caption || '');
  const filterComplex = [
    `[0:v]scale=1080:1920,crop=1080:1824:0:0,drawtext=text='${safeCaption}':fontcolor=white:borderw=3:bordercolor=black:fontsize=52:x=(w-text_w)/2:y=h-(h*0.3)-text_h/2:enable='between(t,0.5,2)'[hook]`,
    `[1:v]scale=1080:1920,crop=1080:1824:0:0[demo]`,
    `[hook][demo]concat=n=2:v=1:a=0[vout]`
  ].join(';');

  return [
    '-y',
    '-i', hookPath,
    '-i', demoPath,
    '-i', audioPath,
    '-filter_complex', filterComplex,
    '-map', '[vout]',
    '-map', '2:a',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-shortest',
    outputPath
  ];
}

function parseFfmpegTime(line) {
  const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
  if (!timeMatch) {
    return null;
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const seconds = Number(timeMatch[3]);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatLog(line) {
  return line.toString().trim();
}

function runFfmpeg(ffmpegPath, args, onLog) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { shell: false });
    let lastTime = 0;

    child.stderr.on('data', (data) => {
      const text = data.toString();
      const lines = text.split(/\r?\n/).filter(Boolean);
      lines.forEach((line) => {
        onLog(formatLog(line));
      });
      const timeValue = parseFfmpegTime(text);
      if (timeValue !== null && timeValue !== lastTime) {
        lastTime = timeValue;
        onLog(`progress: ${timeValue.toFixed(2)}s`);
      }
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

async function processHooks({ hooksFolder, demoVideo, audioFile, captions, outputDir, ffmpegPath, onLog, onProgress }) {
  if (!hooksFolder || !demoVideo || !audioFile) {
    throw new Error('Hooks folder, demo video, and audio file are required.');
  }

  const resolvedHooks = path.resolve(hooksFolder);
  const resolvedDemo = path.resolve(demoVideo);
  const resolvedAudio = path.resolve(audioFile);
  const resolvedOutput = path.resolve(outputDir || path.join(process.cwd(), 'outputs'));

  createDirectory(resolvedOutput);

  const hooks = getHookFiles(resolvedHooks);
  if (hooks.length === 0) {
    throw new Error('No MP4 hook videos found in the selected hooks folder.');
  }

  onLog(`Found ${hooks.length} hook files.`);

  for (let index = 0; index < hooks.length; index += 1) {
    const file = hooks[index];
    const caption = captions && captions.length > 0 ? captions[index % captions.length] : 'Watch this now';
    const inputPath = path.join(resolvedHooks, file);
    const outputPath = path.join(resolvedOutput, `output_${index + 1}.mp4`);

    onLog(`\n--- Processing ${file} (${index + 1}/${hooks.length}) ---`);
    onLog(`Caption: ${caption}`);

    const args = buildFfmpegArgs(inputPath, resolvedDemo, resolvedAudio, outputPath, caption);

    try {
      await runFfmpeg(ffmpegPath, args, onLog);
      onLog(`✅ Completed: ${outputPath}`);
    } catch (error) {
      onLog(`❌ Failed: ${file} — ${error.message}`);
    }

    onProgress({
      value: Math.round(((index + 1) / hooks.length) * 100),
      label: `Processed ${index + 1} of ${hooks.length}`
    });
  }

  onLog('\nProcessing complete. Final videos are available in the outputs folder.');
}

module.exports = { processHooks };
