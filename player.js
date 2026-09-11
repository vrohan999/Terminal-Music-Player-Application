// player.js — music playback and child-process management

const { spawn } = require('child_process');

let currentProcess = null;

function play(filePath, callbacks) {
  stop(); // kill any currently playing song first

  currentProcess = spawn('afplay', [filePath]);

  currentProcess.on('close', function (code) {
    currentProcess = null;
    // code 0 = finished naturally; non-zero or null = killed/error
    if (code === 0 && callbacks && callbacks.onFinish) {
      callbacks.onFinish();
    }
  });

  currentProcess.on('error', function (err) {
    currentProcess = null;
    if (callbacks && callbacks.onError) {
      callbacks.onError(err);
    }
  });
}

function stop() {
  if (currentProcess) {
    currentProcess.kill();
    currentProcess = null;
  }
}

function isPlaying() {
  return currentProcess !== null;
}

module.exports = { play, stop, isPlaying };
