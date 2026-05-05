const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// ---------------- CONFIG ----------------
const hooksDir = path.join(__dirname, "hooks");
const demoPath = path.join(__dirname, "demo", "demo.mp4");
const audioPath = path.join(__dirname, "audio", "audio.mp4");
const outputDir = path.join(__dirname, "outputs");

const captions = [
  "You are doing this wrong",
  "Stop scrolling Watch this now",
  "What they don't want you to know",
  "The fix everyone missed",
  "This one change made it easy",
  "Don't try another hack until this",
  "You won't believe how simple this is",
  "This changed everything",
  "No one told me this",
  "This saved me hours",
  "You are missing this"
];

// --------------- SAFETY -----------------
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

if (!fs.existsSync(hooksDir)) {
  console.error("❌ hooks folder not found");
  process.exit(1);
}

if (!fs.existsSync(demoPath)) {
  console.error("❌ demo video missing");
  process.exit(1);
}

if (!fs.existsSync(audioPath)) {
  console.error("❌ audio file missing");
  process.exit(1);
}

// --------------- GET HOOKS --------------
const hooks = fs.readdirSync(hooksDir).filter(f => f.endsWith(".mp4"));

if (hooks.length === 0) {
  console.error("❌ No videos inside hooks folder");
  process.exit(1);
}

// --------------- PROCESS ----------------
hooks.forEach((file, index) => {
  const hookPath = path.join(hooksDir, file);
  const caption = captions[index % captions.length];
  const outputPath = path.join(outputDir, `output_${index}.mp4`);

  console.log(`🎬 Processing: ${file}`);

  // escape caption safely and support multiline text with \n
  const safeCaption = caption
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n");

  const filterComplex = `[0:v]scale=1080:1920,crop=1080:1824:0:0,drawtext=text='${safeCaption}':fontcolor=white:fontsize=52:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-(h*0.3)-text_h/2:enable='between(t,0.5,4)'[v0];[1:v]scale=1080:1920,crop=1080:1824:0:0[v1];[v0][v1]concat=n=2:v=1:a=0[vout]`;

  const ffmpegArgs = [
    "-y",
    "-i", hookPath,
    "-i", demoPath,
    "-i", audioPath,
    "-filter_complex", filterComplex,
    "-map", "[vout]",
    "-map", "2:a",
    "-af", "apad",
    "-c:v", "libx264",
    "-c:a", "aac",
    "-shortest",
    outputPath
  ];

  const ff = spawn("ffmpeg", ffmpegArgs);

  ff.stderr.on("data", (data) => {
    console.log(data.toString()); // shows real FFmpeg logs
  });

  ff.on("close", (code) => {
    if (code === 0) {
      console.log(`✅ Done: ${outputPath}`);
    } else {
      console.error(`❌ Failed: ${file}`);
    }
  });
});