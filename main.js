const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { processHooks } = require('./core/videoProcessor');
const { resolveFfmpegPath } = require('./core/ffmpegResolver');

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 900,
    minHeight: 660,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:selectFile', async (_, options) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: options.filters
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('video:generate', async (event, payload) => {
  const ffmpegPath = resolveFfmpegPath();
  const outputDir = payload.outputDir && payload.outputDir.trim().length
    ? payload.outputDir
    : path.join(process.cwd(), 'outputs');

  let didFail = false;

  const log = (message) => {
    event.sender.send('video:log', message);
  };

  const progress = (value, label) => {
    event.sender.send('video:progress', { value, label });
  };

  try {
    await processHooks({
      hooksFolder: payload.hooksFolder,
      demoVideo: payload.demoVideo,
      audioFile: payload.audioFile,
      captions: payload.captions,
      outputDir: payload.outputDir,
      ffmpegPath,
      onLog: log,
      onProgress: progress
    });

    event.sender.send('video:complete', { success: true });
  } catch (error) {
    didFail = true;
    event.sender.send('video:error', error.message || 'Unknown error');
  }

  return { success: !didFail };
});
