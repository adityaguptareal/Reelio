const hooksPathInput = document.getElementById('hooksPath');
const demoPathInput = document.getElementById('demoPath');
const audioPathInput = document.getElementById('audioPath');
const captionsInput = document.getElementById('captions');
const selectHooksButton = document.getElementById('selectHooks');
const selectDemoButton = document.getElementById('selectDemo');
const selectAudioButton = document.getElementById('selectAudio');
const generateButton = document.getElementById('generate');
const logPanel = document.getElementById('logPanel');
const statusLabel = document.getElementById('statusLabel');
const progressFill = document.getElementById('progressFill');

const appendLog = (message) => {
  const timestamp = new Date().toLocaleTimeString();
  logPanel.textContent += `[${timestamp}] ${message}\n`;
  logPanel.scrollTop = logPanel.scrollHeight;
};

const resetUI = () => {
  statusLabel.textContent = 'Ready';
  progressFill.style.width = '0%';
  logPanel.textContent = 'No actions yet.';
};

const disableUI = (disabled) => {
  [selectHooksButton, selectDemoButton, selectAudioButton, generateButton].forEach((button) => {
    button.disabled = disabled;
    button.style.opacity = disabled ? '0.65' : '1';
  });
};

selectHooksButton.addEventListener('click', async () => {
  const folder = await window.api.selectFolder();
  if (folder) {
    hooksPathInput.value = folder;
  }
});

selectDemoButton.addEventListener('click', async () => {
  const file = await window.api.selectFile([{ name: 'Videos', extensions: ['mp4'] }]);
  if (file) {
    demoPathInput.value = file;
  }
});

selectAudioButton.addEventListener('click', async () => {
  const file = await window.api.selectFile([{ name: 'Audio', extensions: ['mp3', 'm4a', 'wav', 'aac', 'mp4'] }]);
  if (file) {
    audioPathInput.value = file;
  }
});

generateButton.addEventListener('click', async () => {
  const hooksFolder = hooksPathInput.value.trim();
  const demoVideo = demoPathInput.value.trim();
  const audioFile = audioPathInput.value.trim();
  const captions = captionsInput.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!hooksFolder || !demoVideo || !audioFile) {
    appendLog('Please select hooks folder, demo video, and audio file before generating.');
    return;
  }

  disableUI(true);
  statusLabel.textContent = 'Starting generation...';
  progressFill.style.width = '0%';
  logPanel.textContent = '';

  try {
    await window.api.generateVideos({
      hooksFolder,
      demoVideo,
      audioFile,
      captions,
      outputDir: '',
    });
  } catch (error) {
    appendLog(`Error: ${error.message || error}`);
  }
});

window.api.onLog((message) => {
  appendLog(message);
});

window.api.onProgress(({ value, label }) => {
  progressFill.style.width = `${value}%`;
  statusLabel.textContent = label;
});

window.api.onComplete(() => {
  statusLabel.textContent = 'Generation completed successfully.';
  appendLog('✅ All tasks complete. Check the outputs folder.');
  disableUI(false);
});

window.api.onError((error) => {
  statusLabel.textContent = 'Error occurred';
  appendLog(`❌ ${error}`);
  disableUI(false);
});

resetUI();
