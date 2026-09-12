// player.js — music playback and child-process management

const { spawn } = require('child_process');

// The three possible states the player can be in at any time
const STATE = {
  STOPPED: 'STOPPED',
  PLAYING: 'PLAYING',
  PAUSED:  'PAUSED'
};

let currentProcess = null;
let state = STATE.STOPPED;

// Each call to play() gets a unique generation number.
// The onFinish/onError callbacks capture it and only fire if the generation
// still matches — this prevents a killed process from accidentally triggering
// auto-next when the user rapidly changes songs.
let generation = 0;

function play(filePath, callbacks) {
  stop(); // stop any currently playing or paused song first

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
  currentProcess.kill('SIGSTOP'); // freeze the process in place
  state = STATE.PAUSED;
  return true;
}

function resume() {
  if (state !== STATE.PAUSED) return false;
  currentProcess.kill('SIGCONT'); // unfreeze the process
  state = STATE.PLAYING;
  return true;
}

function stop() {
  if (currentProcess) {
    // A SIGSTOP'd process cannot receive SIGTERM — send SIGCONT first
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
