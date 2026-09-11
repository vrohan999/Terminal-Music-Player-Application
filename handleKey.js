// handleKey.js — user input/commands

function startListening(onKey) {
  // Raw mode delivers individual keypresses instead of buffered lines
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', function (key) {
    if (key === '\u0003') process.exit(); // Ctrl+C
    onKey(key);
  });
}

function stopListening() {
  process.stdin.pause();
}

module.exports = { startListening, stopListening };
