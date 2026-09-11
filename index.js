// index.js — entry point

const ui = require('./ui');
const handleKey = require('./handleKey');
const player = require('./player');

ui.clearScreen();
ui.showTitle();
ui.showMessage('Music player started! Press Ctrl+C to quit.');
ui.showMessage('(Playback features coming soon...)');
console.log();

handleKey.startListening(function (key) {
  ui.showMessage('Key pressed: "' + key.trim() + '" — commands not yet implemented.');
});
