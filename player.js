// player.js — music playback and child-process management

const { spawn } = require('child_process');

const STATE = {
  STOPPED: 'STOPPED',
  PLAYING: 'PLAYING',
  PAUSED:  'PAUSED'
};

let currentProcess = null;
let state = STATE.STOPPED;

// Stops an old, killed process from triggering auto-next
let generation = 0;

function play(filePath, callbacks) {
  stop();

  generation++;
  const myGeneration = generation;

  currentProcess = spawn('afplay', [filePath]);
  state = STATE.PLAYING;

  currentProcess.on('close', function (code) {
    currentProcess = null;
    state = STATE.STOPPED;

    if (code === 0 && myGeneration === generation && callbacks && callbacks.onFinish) {
      callbacks.onFinish();
    }
  });

  currentProcess.on('error', function (err) {
    currentProcess = null;
    state = STATE.STOPPED;

    if (myGeneration === generation && callbacks && callbacks.onError) {
      callbacks.onError(err);
    }
  });
}

function pause() {
  if (state !== STATE.PLAYING) return false;
  currentProcess.kill('SIGSTOP'); // freeze the process
  state = STATE.PAUSED;
  return true;
}

function resume() {
  if (state !== STATE.PAUSED) return false;
  currentProcess.kill('SIGCONT');
  state = STATE.PLAYING;
  return true;
}

function stop() {
  if (currentProcess) {
    // A frozen (SIGSTOP) process ignores SIGTERM, so unfreeze it first
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
