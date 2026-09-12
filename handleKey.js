// handleKey.js — user input/commands

const readline = require('readline');

let rl = null;
let quitting = false; // guard against double-firing onCommand('q')

function startListening(onCommand) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();

  rl.on('line', function (line) {
    const input = line.trim().toLowerCase();
    if (input !== '') {
      onCommand(input);
    }
    // Re-show the prompt after every command (synchronous commands return here)
    rl.prompt();
  });

  // Ctrl+C
  rl.on('SIGINT', function () {
    if (!quitting) {
      quitting = true;
      onCommand('q');
    }
  });

  // Ctrl+D or stream closed — only fire if not already quitting
  rl.on('close', function () {
    if (!quitting) {
      quitting = true;
      onCommand('q');
    }
  });
}

// Call this after async events (e.g. a song finishing) to re-show the prompt
function prompt() {
  if (rl) rl.prompt(true);
}

function stopListening() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

module.exports = { startListening, prompt, stopListening };
