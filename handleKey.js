// handleKey.js — reads single keypresses and turns them into commands

const readline = require('readline');

const NUMBER_DELAY_MS = 600;

let quitting = false;
let digitBuffer = '';
let digitTimer = null;

function startListening(onCommand) {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true); // keys arrive instantly and aren't echoed
  process.stdin.resume();

  function quit() {
    if (!quitting) {
      quitting = true;
      onCommand('q');
    }
  }

  process.stdin.on('keypress', function (str, key) {
    key = key || {};

    if (key.ctrl && (key.name === 'c' || key.name === 'd')) return quit();

    // Wait briefly for a second digit so song numbers like 12 work
    if (str && /^[0-9]$/.test(str)) {
      digitBuffer += str;
      clearTimeout(digitTimer);
      digitTimer = setTimeout(function () {
        const number = digitBuffer;
        digitBuffer = '';
        onCommand(number);
      }, NUMBER_DELAY_MS);
      return;
    }

    if (key.name === 'up' || key.name === 'down') return onCommand(key.name);
    if (key.name === 'return' || key.name === 'enter') return onCommand('enter');

    if (str && /^[a-z]$/i.test(str)) {
      const letter = str.toLowerCase();
      if (letter === 'q') return quit();
      onCommand(letter);
    }
  });

  process.stdin.on('end', quit);
}

function stopListening() {
  clearTimeout(digitTimer);
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();
}

module.exports = { startListening, stopListening };
