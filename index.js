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

// --- Application state ---

let currentIndex = -1; // -1 = nothing played yet

// --- Song playback ---

function playSong(index) {
  if (songs.length === 0) {
    ui.showMessage('No songs available.');
    return;
  }

  // Wrap around: works for both positive overflow and negative values
  currentIndex = ((index % songs.length) + songs.length) % songs.length;

  const songName = songs[currentIndex];
  const filePath = path.join(SONGS_DIR, songName + '.mp3');
  const capturedIndex = currentIndex;

  ui.showMessage('Playing: ' + songName);

  player.play(filePath, {
    onFinish: function () {
      ui.showMessage('Finished: ' + songName);
      // Auto-advance to next song using the index captured at play time
      playSong(capturedIndex + 1);
      handleKey.prompt();
    },
    onError: function (err) {
      ui.showMessage('Playback error: ' + err.message);
      handleKey.prompt();
    }
  });
}

// --- Command handler ---

function onCommand(input) {
  const num = parseInt(input, 10);

  if (!isNaN(num)) {
    if (songs.length === 0) {
      ui.showMessage('No songs available.');
      return;
    }
    if (num < 1 || num > songs.length) {
      ui.showMessage('Invalid number. Enter 1–' + songs.length + '.');
      return;
    }
    playSong(num - 1);
    return;
  }

  switch (input) {
    case 'n':
      // If nothing played yet, start at the first song; otherwise advance
      playSong(currentIndex < 0 ? 0 : currentIndex + 1);
      break;
    case 'b':
      // If nothing played yet, start at the last song; otherwise go back
      playSong(currentIndex < 0 ? songs.length - 1 : currentIndex - 1);
      break;
    case 'p':
      if (player.getState() === 'PLAYING') {
        player.pause();
        ui.showMessage('Paused.');
      } else if (player.getState() === 'PAUSED') {
        ui.showMessage('Already paused.');
      } else {
        ui.showMessage('Nothing is playing.');
      }
      break;
    case 'r':
      if (player.getState() === 'PAUSED') {
        player.resume();
        ui.showMessage('Resumed.');
      } else if (player.getState() === 'PLAYING') {
        ui.showMessage('Already playing.');
      } else {
        ui.showMessage('Nothing to resume.');
      }
      break;
    case 's':
      if (player.getState() !== 'STOPPED') {
        player.stop();
        ui.showMessage('Song stopped.');
      } else {
        ui.showMessage('No song is playing.');
      }
      break;
    case 'h':
      ui.showHelp();
      break;
    case 'q':
      ui.showMessage('Goodbye!');
      player.stop();
      process.exit(0);
      break;
    default:
      ui.showMessage('Unknown command "' + input + '". Press h for help.');
  }
}

// --- Startup ---

ui.clearScreen();
ui.showTitle();
ui.showSongList(songs);

handleKey.startListening(onCommand);
