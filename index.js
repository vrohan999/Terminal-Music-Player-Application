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
  const num = parseInt(key.trim(), 10);

  if (isNaN(num) || num < 1 || num > songs.length) {
    ui.showMessage('Enter a number between 1 and ' + songs.length + '.');
    return;
  }

  const songName = songs[num - 1];
  const filePath = path.join(SONGS_DIR, songName + '.mp3');

  ui.showMessage('▶  Now playing: ' + songName);

  player.play(filePath, {
    onFinish: function () {
      ui.showMessage('✔  Finished: ' + songName);
    },
    onError: function (err) {
      ui.showMessage('✖  Playback error: ' + err.message);
    }
  });
});

