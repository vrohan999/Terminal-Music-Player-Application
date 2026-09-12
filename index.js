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

// --- Command handler ---

function onCommand(input) {
  const num = parseInt(input, 10);

  if (!isNaN(num)) {
    if (num < 1 || num > songs.length) {
      ui.showMessage('Invalid number. Enter 1–' + songs.length + '.');
      return;
    }
    const songName = songs[num - 1];
    const filePath = path.join(SONGS_DIR, songName + '.mp3');
    ui.showMessage('Playing: ' + songName);
    player.play(filePath, {
      onFinish: function () {
        ui.showMessage('Finished: ' + songName);
        handleKey.prompt();
      },
      onError: function (err) {
        ui.showMessage('Playback error: ' + err.message);
        handleKey.prompt();
      }
    });
    return;
  }

  switch (input) {
    case 's':
      if (player.isPlaying()) {
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

// --- Start listening ---

handleKey.startListening(onCommand);
