// index.js — entry point

const path = require('path');
const fs = require('fs');
const ui = require('./ui');
const handleKey = require('./handleKey');
const player = require('./player');

// --- Song library ---

const SONGS_DIR = path.join(__dirname, 'songs');

function loadSongs() {
  if (!fs.existsSync(SONGS_DIR)) return [];
  return fs.readdirSync(SONGS_DIR)
    .filter(file => path.extname(file).toLowerCase() === '.mp3')
    .map(file => path.basename(file, '.mp3'));
}

const songs = loadSongs();

// --- Application state ---

const state = {
  songs,
  currentIndex: -1,
  playerState: 'STOPPED',
  message: ''
};

// Sync player state into the shared state object, then redraw
function render(message) {
  state.playerState = player.getState();
  state.message = message !== undefined ? message : state.message;
  ui.render(state);
}

// --- Song playback ---

function playSong(index) {
  if (songs.length === 0) {
    render('No songs available.');
    return;
  }

  state.currentIndex = ((index % songs.length) + songs.length) % songs.length;
  const capturedIndex = state.currentIndex;
  const songName = songs[state.currentIndex];
  const filePath = path.join(SONGS_DIR, songName + '.mp3');

  player.play(filePath, {
    onFinish: function () {
      playSong(capturedIndex + 1);
      handleKey.prompt();
    },
    onError: function (err) {
      render('Playback error: ' + err.message);
      handleKey.prompt();
    }
  });

  render(''); // playerState is now PLAYING; message clears on new song
}

// --- Command handler ---

function onCommand(input) {
  const num = parseInt(input, 10);

  if (!isNaN(num)) {
    if (songs.length === 0) { render('No songs available.'); return; }
    if (num < 1 || num > songs.length) {
      render('Invalid number. Enter 1–' + songs.length + '.');
      return;
    }
    playSong(num - 1);
    return;
  }

  switch (input) {
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
      ui.clearScreen();
      console.log('\n  Goodbye!\n');
      process.exit(0);
      break;
    default:
      render('Unknown command "' + input + '". Press h for help.');
  }
}

// --- Startup ---

render('');
handleKey.startListening(onCommand);
