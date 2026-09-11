// ui.js — terminal interface and status messages

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function showTitle() {
  console.log('=========================================');
  console.log('        🎵  Terminal Music Player  🎵   ');
  console.log('=========================================');
  console.log();
}

function showMessage(message) {
  console.log('  ' + message);
}

module.exports = { clearScreen, showTitle, showMessage };
