// player.js — music playback and child-process management

const { spawn } = require('child_process');

const STATE = {
  STOPPED: 'STOPPED',
  PLAYING: 'PLAYING',
  PAUSED:  'PAUSED'
};

let currentProcess = null;
let state = STATE.STOPPED;

function play(filePath, callbacks) {
  stop(); // handles PAUSED → kill safely, resets state

  currentProcess = spawn('afplay', [filePath]);
  state = STATE.PLAYING;

  currentProcess.on('close', function (code) {
    currentProcess = null;
    state = STATE.STOPPED;
    if (code === 0 && callbacks && callbacks.onFinish) {
      callbacks.onFinish();
    }
  });

  currentProcess.on('error', function (err) {
    currentProcess = null;
    state = STATE.STOPPED;
    if (callbacks && callbacks.onError) {
      callbacks.onError(err);
    }
  });
}

function pause() {
  if (state !== STATE.PLAYING) return false;
  currentProcess.kill('SIGSTOP'); // freeze the afplay process
  state = STATE.PAUSED;
  return true;
}

function resume() {
  if (state !== STATE.PAUSED) return false;
  currentProcess.kill('SIGCONT'); // unfreeze the afplay process
  state = STATE.PLAYING;
  return true;
}

function stop() {
  if (currentProcess) {
    // A SIGSTOP'd process won't receive SIGTERM — resume it first
    if (state === STATE.PAUSED) currentProcess.kill('SIGCONT');
    currentProcess.kill();
    currentProcess = null;
  }
  state = STATE.STOPPED;
}

function getState() {
  return state;
}

module.exports = { play, pause, resume, stop, getState };
