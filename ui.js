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

function showSongList(songs) {
  if (songs.length === 0) {
    console.log('  No songs found. Add .mp3 files to the songs/ folder.');
    console.log();
    return;
  }

  console.log('  Available Songs:');
  console.log();
  songs.forEach(function (name, index) {
    console.log('  ' + (index + 1) + '. ' + name);
  });
  console.log();
  console.log('  Enter a song number to play.');
  console.log();
}

function showHelp() {
  console.log();
  console.log('  Commands:');
  console.log('  [number]  Play a song');
  console.log('  p         Pause');
  console.log('  r         Resume');
  console.log('  s         Stop');
  console.log('  h         Show this help');
  console.log('  q         Quit');
  console.log();
}

function showMessage(message) {
  console.log('  ' + message);
}

module.exports = { clearScreen, showTitle, showSongList, showHelp, showMessage };

