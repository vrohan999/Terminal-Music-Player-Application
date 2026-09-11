// player.js — music playback and child-process management

let currentProcess = null;

function play(filePath) {
  console.log('  [player] play() not yet implemented. File:', filePath);
}

function stop() {
  console.log('  [player] stop() not yet implemented.');
}

function isPlaying() {
  return currentProcess !== null;
}

module.exports = { play, stop, isPlaying };
