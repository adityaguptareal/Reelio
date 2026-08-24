# Video Automation Tool

A cross-platform Electron desktop app that automates hook-based social video generation using FFmpeg.

## What it does

This app takes:

- a folder of hook videos (UGC clips)
- a fixed demo video
- a fixed audio track
- a caption list

Then it automatically generates final videos by:

1. scaling each hook and demo clip to 1080x1920
2. cropping the bottom 5% of each clip
3. overlaying a bold white caption with black border from 0.5s to 2s
4. concatenating the hook clip with the demo clip
5. applying the selected audio track
6. saving output files to `outputs/`

## Project structure

```
Reelio/
  ├─ core/
  │   ├─ ffmpegResolver.js
  │   └─ videoProcessor.js
  ├─ ffmpeg/
  │   └─ .gitkeep
  ├─ outputs/
  │   └─ .gitkeep
  ├─ renderer/
  │   ├─ index.html
  │   ├─ renderer.js
  │   └─ styles.css
  ├─ main.js
  ├─ preload.js
  ├─ package.json
  ├─ README.md
  └─ .gitignore
```

## Usage

### Install dependencies

```bash
cd c:\Users\codea\Documents\Business\Projects\Python-data\Reelio
npm install
```

### Run in development

```bash
npm start
```

### Build installable app

```bash
npm run dist
```

This creates installers for Windows and macOS using `electron-builder`.

## How to use the app

1. Click `Browse` to select the folder containing your hook videos.
2. Choose the fixed demo video.
3. Choose the fixed audio file.
4. Enter one caption per line in the captions input.
5. Click `Generate Videos`.
6. Monitor progress in the status log.
7. Final videos are written to the `outputs/` folder.

## Captions

- Each caption line is rotated over the hook videos.
- The first caption will overlay the first hook, the second caption the second hook, and so on.
- If the caption list is shorter than the number of hooks, captions repeat.

## FFmpeg bundling

The app resolves FFmpeg from the bundled `ffmpeg/` folder if binaries are present, otherwise it falls back to `ffmpeg-static`.

To bundle your own binaries, place them here:

- `ffmpeg/win32/ffmpeg.exe`
- `ffmpeg/macos/ffmpeg`
- `ffmpeg/linux/ffmpeg`

## Technical details

- `main.js` manages the Electron window and IPC.
- `preload.js` exposes a secure API to the renderer.
- `renderer/renderer.js` handles UI events and status logs.
- `core/videoProcessor.js` builds FFmpeg commands and processes files sequentially.
- `core/ffmpegResolver.js` resolves the FFmpeg binary path for the current platform.

## Notes

- The app uses `libx264` and `aac` for output encoding.
- It uses a fixed caption display window of `between(t,0.5,2)`.
- Outputs are generated in the `outputs/` folder.

## Troubleshooting

- If video generation fails, check the log panel for FFmpeg errors.
- Ensure input files are valid MP4 audio/video files.
- Verify `npm install` completed successfully.

## Build output

- Windows: `nsis` installer
- macOS: `dmg`

If you want macOS and Windows builds from a single machine, use a CI service or macOS host for the DMG build.
