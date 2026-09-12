// handleKey.js — user input/commands

const readline = require('readline');

let rl = null;

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
    rl.prompt();
  });

  // Ctrl+C
  rl.on('SIGINT', function () {
    onCommand('q');
  });

  // Ctrl+D / stream closed
  rl.on('close', function () {
    onCommand('q');
  });
}

// Re-display the prompt (used after async messages print to the terminal)
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
