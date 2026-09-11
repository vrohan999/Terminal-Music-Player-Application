// index.js — entry point

const path = require('path');
const fs = require('fs');
const ui = require('./ui');
const handleKey = require('./handleKey');
const player = require('./player');

// --- Song library ---

const SONGS_DIR = path.join(__dirname, 'songs');

function loadSongs() {
  if (!fs.existsSync(SONGS_DIR)) {
    return [];
  }
  return fs.readdirSync(SONGS_DIR)
    .filter(file => path.extname(file).toLowerCase() === '.mp3')
    .map(file => path.basename(file, '.mp3'));
}

const songs = loadSongs();

// --- Startup ---

ui.clearScreen();
ui.showTitle();
ui.showSongList(songs);

// --- Key input ---

handleKey.startListening(function (key) {
  ui.showMessage('Key pressed: "' + key.trim() + '" — commands not yet implemented.');
});
