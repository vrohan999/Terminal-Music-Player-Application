// index.js — entry point

const path = require('path');
const fs   = require('fs');
const ui   = require('./ui');
const handleKey = require('./handleKey');
const player    = require('./player');

const SONGS_DIR = path.join(__dirname, 'songs');

function loadSongs() {
  if (!fs.existsSync(SONGS_DIR)) return [];
  return fs.readdirSync(SONGS_DIR)
    .filter(file => path.extname(file).toLowerCase() === '.mp3')
    .map(file => ({ name: path.basename(file, path.extname(file)), file: file }));
}

const songs = loadSongs();

const state = {
  songs,
  currentIndex: -1, // -1 means nothing has played yet
  selectedIndex: 0,
  playerState: 'STOPPED',
  message: ''
};

function render(message) {
  state.playerState = player.getState();
  state.message = (message !== undefined) ? message : state.message;
  ui.render(state);
}

function playSong(index) {
  if (songs.length === 0) {
    render('No songs available. Add .mp3 files to the songs/ folder.');
    return;
  }

  // Wrap so the index always stays within 0 … songs.length-1
  state.currentIndex = ((index % songs.length) + songs.length) % songs.length;
  state.selectedIndex = state.currentIndex;

  const capturedIndex = state.currentIndex;
  const filePath = path.join(SONGS_DIR, songs[state.currentIndex].file);

  player.play(filePath, {
    onFinish: function () {
      // Song ended on its own → play the next one
      playSong(capturedIndex + 1);
    },
    onError: function (err) {
      const msg = err.code === 'ENOENT'
        ? 'Error: afplay not found. This app requires macOS.'
        : 'Playback error: ' + err.message;
      render(msg);
    }
  });

  render('');
}

function onCommand(input) {
  // Whole numbers only ("1abc" and "2.5" are rejected)
  if (/^\d+$/.test(input)) {
    const num = parseInt(input, 10);
    if (songs.length === 0) {
      render('No songs available.');
      return;
    }
    if (num < 1 || num > songs.length) {
      render('Invalid number. Press a number between 1 and ' + songs.length + '.');
      return;
    }
    playSong(num - 1);
    return;
  }

  switch (input) {
    case 'up':
    case 'down':
      if (songs.length === 0) return;
      state.selectedIndex = (state.selectedIndex + (input === 'up' ? -1 : 1) + songs.length) % songs.length;
      render('');
      break;

    case 'enter':
      playSong(state.selectedIndex);
      break;

    case 'n':
      playSong(state.currentIndex < 0 ? 0 : state.currentIndex + 1);
      break;

    case 'b':
      playSong(state.currentIndex < 0 ? songs.length - 1 : state.currentIndex - 1);
      break;

    case 'p':
      if (player.getState() === 'PLAYING') {
        player.pause();
        render('Paused.');
      } else if (player.getState() === 'PAUSED') {
        render('Already paused.');
      } else {
        render('Nothing is playing.');
      }
      break;

    case 'r':
      if (player.getState() === 'PAUSED') {
        player.resume();
        render('Resumed.');
      } else if (player.getState() === 'PLAYING') {
        render('Already playing.');
      } else {
        render('Nothing to resume.');
      }
      break;

    case 's':
      if (player.getState() !== 'STOPPED') {
        player.stop();
        render('Song stopped.');
      } else {
        render('No song is playing.');
      }
      break;

    case 'h':
      render('');
      break;

    case 'q':
      player.stop();
      handleKey.stopListening();
      ui.clearScreen();
      ui.showCursor();
      console.log('\n  Goodbye!\n');
      process.exit(0);
      break;

    default:
      render('Unknown key "' + input + '". See the commands above.');
  }
}

render('');
handleKey.startListening(onCommand);

process.stdout.on('resize', function () {
  render();
});

// Never leave the terminal with a hidden cursor
process.on('exit', ui.showCursor);
