# Reelio

## Purpose

This project automates the creation of short social-style videos by combining:

- a hook clip from `hooks/`
- a demo clip from `demo/demo.mp4`
- a background/voice audio track from `audio/audio.mp4`
- an overlaid caption text for viewer engagement

The script crops the bottom 5% of each video, scales both clips to 1080x1920, overlays a caption, and concatenates the hook and demo clips into a final output.

## How it works

- `code.js` reads every `.mp4` file inside `Reelio/hooks/`
- each hook file is processed with the demo video and audio track
- captions are selected from the `captions` array
- FFmpeg is invoked to:
  1. scale input videos to 1080x1920
  2. crop the bottom 5% of the video (`1080x1824`)
  3. draw caption text on the hook clip
  4. concatenate the hook and demo video streams
  5. attach the audio track
  6. save results to `outputs/output_<index>.mp4`

## Requirements

- Node.js installed
- `ffmpeg` installed and available on your system `PATH`

## Folder structure

```
Reelio/
  ├─ audio/
  │   └─ audio.mp4
  ├─ demo/
  │   └─ demo.mp4
  ├─ hooks/
  │   ├─ trimmed_0.mp4
  │   ├─ trimmed_1.mp4
  │   └─ ...
  ├─ outputs/
  │   └─ output_0.mp4
  ├─ code.js
  └─ README.md
```

## Usage

1. Place your hook clips into `Reelio/hooks/`.
2. Put the demo clip at `Reelio/demo/demo.mp4`.
3. Put the audio file at `Reelio/audio/audio.mp4`.
4. Run the script from the `Reelio` folder:

```bash
cd Reelio
node code.js
```

5. Final videos will be written to `Reelio/outputs/`.

## Caption customization

The caption text is defined in `code.js` inside the `captions` array.

- Change existing hooks or add more lines
- Single-line captions are currently recommended for safe FFmpeg parsing
- Example:

```js
const captions = [
  "You are doing this wrong",
  "This changed everything",
  "The fix everyone missed",
  "You won't believe how simple this is"
];
```

## Notes

- The script currently uses `-shortest` to stop output when the shortest stream ends.
- `-af apad` is added so the audio will pad if the video is longer than the audio.
- The crop step removes the bottom 5% of the scaled video to create a tighter frame.

## Troubleshooting

- If you get FFmpeg errors about filters, ensure your `ffmpeg` installation is the correct version and available on the `PATH`.
- If output files are missing, check the `hooks/` folder and ensure all input files are valid MP4s.

## Future improvements

- support true multiline captions via a text file or `drawtext` escaping helper
- automatically detect input sizes rather than fixed scaling/crop values
- add separate caption timing per clip
