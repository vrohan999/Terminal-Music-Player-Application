// ui.js — terminal interface and status messages

const chalk = require('chalk');

// ANSI escape codes used to redraw the screen in place
const ESC = '\x1b[';
const CURSOR_HOME  = ESC + 'H';
const CLEAR_SCREEN = ESC + '2J';
const CLEAR_LINE   = ESC + 'K';
const CLEAR_BELOW  = ESC + 'J';
const HIDE_CURSOR  = ESC + '?25l';
const SHOW_CURSOR  = ESC + '?25h';

const WIDTH = 60;

// Move the cursor to column n of the current line (1 = left edge)
function col(n) {
  return ESC + n + 'G';
}

let firstRender = true;

const theme = {
  border:    chalk.cyan,
  title:     chalk.bold.cyan,
  heading:   chalk.bold.white,
  selected:  chalk.inverse,
  playing:   chalk.green,
  paused:    chalk.yellow,
  stopped:   chalk.gray,
  key:       chalk.bold.cyan,
  label:     chalk.dim,
  hint:      chalk.dim,
  error:     chalk.red,
  info:      chalk.yellow
};

const BORDER_COL = WIDTH + 4; // │ + space + content + space + │

function box(title, rows) {
  const lines = [
    theme.border('╭─ ') + theme.heading(title) + theme.border(' ' + '─'.repeat(WIDTH - title.length - 1) + '╮')
  ];
  rows.forEach(function (row) {
    lines.push(theme.border('│') + ' ' + row + CLEAR_LINE + col(BORDER_COL) + theme.border('│'));
  });
  lines.push(theme.border('╰' + '─'.repeat(WIDTH + 2) + '╯'));
  return lines;
}

function header() {
  const title = '🎵  TERMINAL MUSIC PLAYER'; // .length counts the emoji as 2, matching its 2 columns
  const titleCol = 3 + Math.floor((WIDTH - title.length) / 2);
  return [
    theme.border('╔' + '═'.repeat(WIDTH + 2) + '╗'),
    theme.border('║') + CLEAR_LINE + col(titleCol) + theme.title(title) + col(BORDER_COL) + theme.border('║'),
    theme.border('╚' + '═'.repeat(WIDTH + 2) + '╝')
  ];
}

function libraryRows(state) {
  if (state.songs.length === 0) {
    return [theme.hint('No songs found. Add .mp3 files to songs/.')];
  }

  return state.songs.map(function (song, i) {
    const isSelected = (i === state.selectedIndex);
    const isPlaying  = (i === state.currentIndex && state.playerState !== 'STOPPED');

    let row = (isSelected ? '▶ ' : '  ') + (i + 1) + '. ' + song.name;
    if (isSelected) row = theme.selected(row);
    else if (isPlaying) row = theme.playing(row);

    if (isPlaying) row += CLEAR_LINE + col(BORDER_COL - 2) + theme.playing('♪');
    return row;
  });
}

function nowPlayingRows(state) {
  const song = state.currentIndex >= 0 ? state.songs[state.currentIndex].name : '—';
  const status = state.playerState === 'PLAYING' ? theme.playing('▶  PLAYING')
    : state.playerState === 'PAUSED' ? theme.paused('⏸  PAUSED')
      : theme.stopped('■  STOPPED');

  return [
    theme.label('Song   ') + chalk.bold(song),
    theme.label('Status ') + status
  ];
}

const CONTROLS = [
  ['↑↓', 'Select'], ['Enter', 'Play'], ['p', 'Pause'], ['r', 'Resume'],
  ['n', 'Next'], ['b', 'Prev'], ['s', 'Stop'], ['h', 'Refresh'],
  ['1-9', 'Play #'], ['q', 'Quit']
];
const CONTROL_CELL = 15;
const PER_ROW = 4;

function controlRows() {
  const rows = [];
  for (let i = 0; i < CONTROLS.length; i += PER_ROW) {
    rows.push(CONTROLS.slice(i, i + PER_ROW).map(function (c, k) {
      return col(3 + k * CONTROL_CELL) + theme.key(c[0]) + ' ' + theme.label(c[1]);
    }).join(''));
  }
  return rows;
}

function messageLine(message) {
  if (!message) return '';
  const isError = /^(Invalid|Unknown|Error|Playback error|No song|Nothing|No songs)/.test(message);
  return '  ' + (isError ? theme.error(message) : theme.info(message));
}

function clearScreen() {
  process.stdout.write(CLEAR_SCREEN + CURSOR_HOME);
}

// Build the whole frame as one string and write it once, so there is no flicker
function render(state) {
  const lines = [].concat(
    header(),
    box('Library', libraryRows(state)),
    box('Now Playing', nowPlayingRows(state)),
    box('Controls', controlRows()),
    [messageLine(state.message)]
  );

  const start = firstRender ? CLEAR_SCREEN + CURSOR_HOME : CURSOR_HOME;
  firstRender = false;

  const body = lines
    .map(function (line) { return line + CLEAR_LINE; })
    .join('\n');

  process.stdout.write(HIDE_CURSOR + start + body + '\n' + CLEAR_BELOW);
}

function showCursor() {
  process.stdout.write(SHOW_CURSOR);
}

module.exports = { clearScreen, render, showCursor };
