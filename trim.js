const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const inputDir = path.join(__dirname, "hooks");
const outputDir = path.join(__dirname, "trimmed");

// create output folder
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// get all videos
const files = fs.readdirSync(inputDir).filter(f => f.endsWith(".mp4"));

files.forEach((file, index) => {
  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, `trimmed_${index}.mp4`);

  console.log(`✂️ Trimming: ${file}`);

  // get video duration first
  const probe = spawn("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    inputPath
  ]);

  let duration = "";

  probe.stdout.on("data", (data) => {
    duration += data.toString();
  });

  probe.on("close", () => {
    const totalDuration = parseFloat(duration.trim());

    if (!totalDuration || totalDuration <= 6) {
      console.log(`⚠️ Skipped (too short): ${file}`);
      return;
    }

    const start = 2;
    const end = totalDuration - 1;

    const args = [
      "-y",
      "-i", inputPath,
      "-ss", start.toString(),
      "-to", end.toString(),
      "-c:v", "libx264",
      "-c:a", "aac",
      outputPath
    ];

    const ff = spawn("ffmpeg", args);

    ff.stderr.on("data", (data) => {
      console.log(data.toString());
    });

    ff.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Done: ${outputPath}`);
      } else {
        console.error(`❌ Failed: ${file}`);
      }
    });
  });
});