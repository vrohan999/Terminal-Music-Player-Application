// ui.js — terminal interface and status messages

const DIVIDER = '─'.repeat(42);

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function render(state) {
  clearScreen();

  // Title
  console.log('╔' + '═'.repeat(42) + '╗');
  console.log('║       🎵  TERMINAL MUSIC PLAYER          ║');
  console.log('╚' + '═'.repeat(42) + '╝');
  console.log();

  // Song list
  console.log('  Songs');
  console.log('  ' + DIVIDER);
  console.log();

  if (state.songs.length === 0) {
    console.log('  No songs found. Add .mp3 files to the songs/ folder.');
  } else {
    state.songs.forEach(function (name, i) {
      const marker = (i === state.currentIndex) ? '▶ ' : '  ';
      console.log('  ' + marker + (i + 1) + '. ' + name);
    });
  }
  console.log();

  // Now playing / status
  const songName = state.currentIndex >= 0 ? state.songs[state.currentIndex] : '—';
  const statusIcon = state.playerState === 'PLAYING' ? '▶  PLAYING'
    : state.playerState === 'PAUSED' ? '⏸  PAUSED'
      : '■  STOPPED';

  console.log('  Now Playing : ' + songName);
  console.log('  Status      : ' + statusIcon);
  console.log();

  // Commands
  console.log('  Commands');
  console.log('  ' + DIVIDER);
  console.log();
  console.log('  [number]  Play song    n  Next song');
  console.log('  p         Pause        b  Previous song');
  console.log('  r         Resume       s  Stop');
  console.log('  h         Refresh      q  Quit');
  console.log();

  // Status message
  if (state.message) {
    console.log('  ' + state.message);
    console.log();
  }
}

module.exports = { clearScreen, render };
