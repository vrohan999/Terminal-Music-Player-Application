// index.js — entry point

const path = require('path');
const fs   = require('fs');
const ui   = require('./ui');
const handleKey = require('./handleKey');
const player    = require('./player');

// ---------------------------------------------------------------------------
// Song library
// ---------------------------------------------------------------------------

const SONGS_DIR = path.join(__dirname, 'songs');

function loadSongs() {
  if (!fs.existsSync(SONGS_DIR)) return [];
  return fs.readdirSync(SONGS_DIR)
    .filter(file => path.extname(file).toLowerCase() === '.mp3')
    .map(file => path.basename(file, '.mp3'));
}

const songs = loadSongs();

// ---------------------------------------------------------------------------
// Application state — a single object passed to ui.render() on every change
// ---------------------------------------------------------------------------

const state = {
  songs,
  currentIndex: -1,   // -1 means no song has been selected yet
  playerState: 'STOPPED',
  message: ''
};

// Sync player state then redraw the full UI
function render(message) {
  state.playerState = player.getState();
  state.message = (message !== undefined) ? message : state.message;
  ui.render(state);
}

// ---------------------------------------------------------------------------
// Song playback
// ---------------------------------------------------------------------------

function playSong(index) {
  if (songs.length === 0) {
    render('No songs available. Add .mp3 files to the songs/ folder.');
    return;
  }

  // Wrap index so it always stays within 0 … songs.length-1
  state.currentIndex = ((index % songs.length) + songs.length) % songs.length;

  const capturedIndex = state.currentIndex; // close over the index, not the variable
  const songName = songs[state.currentIndex];
  const filePath  = path.join(SONGS_DIR, songName + '.mp3');

  player.play(filePath, {
    onFinish: function () {
      // Song ended naturally — automatically start the next one
      playSong(capturedIndex + 1);
      handleKey.prompt(); // re-show '>' after the async redraw
    },
    onError: function (err) {
      // afplay is unavailable or the file is unreadable
      const msg = err.code === 'ENOENT'
        ? 'Error: afplay not found. This app requires macOS.'
        : 'Playback error: ' + err.message;
      render(msg);
      handleKey.prompt();
    }
  });

  render(''); // redraw now that playerState is PLAYING
}

// ---------------------------------------------------------------------------
// Command handler — receives cleaned input from handleKey.js
// ---------------------------------------------------------------------------

function onCommand(input) {
  const num = parseInt(input, 10);

  // Numeric input → play that song number
  if (!isNaN(num)) {
    if (songs.length === 0) {
      render('No songs available.');
      return;
    }
    if (num < 1 || num > songs.length) {
      render('Invalid number. Enter a number between 1 and ' + songs.length + '.');
      return;
    }
    playSong(num - 1);
    return;
  }

  switch (input) {
    case 'n':
      // If nothing has played yet, start at the first song
      playSong(state.currentIndex < 0 ? 0 : state.currentIndex + 1);
      break;

    case 'b':
      // If nothing has played yet, start at the last song
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
      render(''); // redraw the screen (commands are always visible)
      break;

    case 'q':
      player.stop(); // ensure afplay is killed before we exit
      ui.clearScreen();
      console.log('\n  Goodbye!\n');
      process.exit(0);
      break;

    default:
      render('Unknown command "' + input + '". Press h to see commands.');
  }
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

render('');
handleKey.startListening(onCommand);
