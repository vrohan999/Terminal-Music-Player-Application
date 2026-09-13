# Terminal Music Player

A simple, interactive music player that runs in the terminal. Built with Node.js built-in modules plus one npm package, [chalk](https://www.npmjs.com/package/chalk), for colours.

---

## Features

- Browse a numbered list of all MP3 files in the `songs/` folder
- Move through the list with the **↑ / ↓ arrow keys** and press **Enter** to play
- Single-key controls — no typing commands, no input field
- Play, pause, resume, and stop songs
- Skip to the next or previous song
- Automatically plays the next song when the current one finishes
- Wraps around from the last song back to the first (and vice versa)
- Clean full-screen terminal UI, redrawn in place with ANSI escape codes (no flicker)
- Redraws automatically when the terminal window is resized
- Graceful handling of missing files and invalid input (only whole numbers select a song)

---

## Requirements

| Requirement | Details |
|---|---|
| **Operating system** | macOS (uses the built-in `afplay` command for audio) |
| **Node.js** | v14 or later |
| **npm packages** | `chalk@4` (colours) — installed with `npm install` |

---

## Project Structure

```
Terminal-Music-Player/
├── songs/          Place your .mp3 files here
├── index.js        Entry point — coordinates the application
├── player.js       Audio playback via child_process.spawn()
├── ui.js           Terminal display and screen rendering
├── handleKey.js    Reads single keypresses (raw mode)
├── package.json    Lists the chalk dependency
├── .gitignore      Keeps node_modules/ out of git
└── README.md
```

Each file has one clear responsibility so the code is easy to follow.

---

## Setup

Clone or download the project, install the dependency once, then run it:

```bash
npm install
```

```bash
node index.js
```

---

## How to Add Songs

1. Copy any `.mp3` files into the `songs/` folder.
2. Run `node index.js`. The player scans the folder on startup.
3. Song titles are displayed without the `.mp3` extension.

Only `.mp3` files are recognised (in any capitalisation, e.g. `.MP3`). Other file types in `songs/` are ignored.

---

## Running the Application

```bash
node index.js
```

The terminal clears and shows the player UI:

```
╔══════════════════════════════════════════════════════════════╗
║                  🎵  TERMINAL MUSIC PLAYER                   ║
╚══════════════════════════════════════════════════════════════╝
╭─ Library ────────────────────────────────────────────────────╮
│   1. Believer                                                │
│   2. Blinding Lights                                       ♪ │
│ ▶ 3. Perfect                                                 │
│   4. Starboy                                                 │
╰──────────────────────────────────────────────────────────────╯
╭─ Now Playing ────────────────────────────────────────────────╮
│ Song   Blinding Lights                                       │
│ Status ▶  PLAYING                                            │
╰──────────────────────────────────────────────────────────────╯
╭─ Controls ───────────────────────────────────────────────────╮
│ ↑↓ Select      Enter Play     p Pause        r Resume        │
│ n Next         b Prev         s Stop         h Refresh       │
│ 1-9 Play #     q Quit                                        │
╰──────────────────────────────────────────────────────────────╯
```

The `▶` arrow (with the highlighted row) shows the selected song and moves with the arrow keys. The `♪` marks the song that is currently playing.
Every command is a single keypress — there is no prompt and nothing to type. Press **Ctrl+C** or `q` to quit.

---

## Command List

| Key | Action |
|---|---|
| ↑ / ↓ | Move the selection arrow up / down (wraps around) |
| Enter | Play the selected song |
| `1`, `2`, … | Play the song with that number. For two-digit numbers, press both digits quickly (within 0.6 s) |
| `n` | Skip to the next song |
| `b` | Go back to the previous song |
| `p` | Pause the current song |
| `r` | Resume a paused song |
| `s` | Stop playback |
| `h` | Refresh the screen |
| `q` | Quit the player |
| Ctrl+C / Ctrl+D | Quit the player |

Letter keys are case-insensitive. Other keys are ignored.

---

## How the Code Works

### `fs` — scanning the song library (`index.js`)

`fs.existsSync()` checks whether the `songs/` directory exists before trying to read it.  
`fs.readdirSync()` returns every filename in the directory as an array.  
`.filter()` keeps only files ending in `.mp3`.  
`.map()` strips the extension so only the song title is stored.

```js
fs.readdirSync(SONGS_DIR)
  .filter(file => path.extname(file).toLowerCase() === '.mp3')
  .map(file => ({ name: path.basename(file, path.extname(file)), file: file }));
```

Each song keeps its real filename, so `Song.MP3` is played from `Song.MP3` rather than a guessed `Song.mp3`.

### ANSI escape codes — redrawing the screen (`ui.js`)

Instead of resetting the terminal, each frame is built as one string and written with a single `process.stdout.write()` call:

| Code | Effect |
|---|---|
| `\x1b[2J` | Clear the whole screen (first frame only) |
| `\x1b[H` | Move the cursor to the top-left corner |
| `\x1b[K` | Clear to the end of the line — removes leftovers from longer old lines |
| `\x1b[J` | Clear everything below the cursor — removes old messages and prompts |
| `\x1b[<n>G` | Move the cursor to column *n* — places the right-hand box border, the `♪` and the control columns |
| `\x1b[?25l` / `\x1b[?25h` | Hide the cursor while the app runs / show it again on quit |

Overwriting the old frame in place avoids the flicker and scrollback wipe caused by a full terminal reset (`\x1bc`). `index.js` also listens for the terminal's `resize` event and redraws.

### `chalk` — colours (`ui.js`)

chalk wraps text in ANSI colour codes. Version 4 is used because it is the last version that supports `require()` (chalk 5+ is ES-module only).
Every colour is defined once in a `theme` object at the top of `ui.js`, so the look can be changed in one place:

```js
const chalk = require('chalk');

const theme = {
  border:   chalk.cyan,      // box lines
  selected: chalk.inverse,   // highlighted row
  playing:  chalk.green,     // ♪ song and PLAYING status
  paused:   chalk.yellow,
  stopped:  chalk.gray,
  error:    chalk.red        // "Invalid number", "Unknown key", …
};

theme.playing('▶  PLAYING');  // → '\x1b[32m▶  PLAYING\x1b[39m'
```

The boxes are a fixed 64 columns wide. Rows are not padded with spaces. Each row is written, the rest of the line is cleared with `\x1b[K`, and the cursor jumps straight to the border column with `\x1b[<n>G` (`col(n)` in `ui.js`). Colour codes take no space on screen, so the right-hand border always lands in the same column:

```js
theme.border('│') + ' ' + row + CLEAR_LINE + col(BORDER_COL) + theme.border('│');
```

chalk switches colours off automatically when the output is not a colour terminal.

### Raw-mode keypresses — reading user input (`handleKey.js`)

`process.stdin.setRawMode(true)` makes the terminal send every key straight to the app, without waiting for Enter and without echoing it on screen — so there is no input field.  
`readline.emitKeypressEvents()` turns the raw bytes into `'keypress'` events. Arrow keys arrive as `key.name === 'up'` / `'down'`.  
Each key is mapped to a short command (`'up'`, `'down'`, `'enter'`, `'p'`, …) and passed to the command handler in `index.js`.

```js
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', function (str, key) {
  if (key.name === 'up' || key.name === 'down') return onCommand(key.name);
  if (key.name === 'return') return onCommand('enter');
  // letters and digits are handled the same way
});
```

On quit, raw mode is turned off and the cursor is shown again so the terminal goes back to normal.

### `child_process.spawn()` — playing audio (`player.js`)

`spawn('afplay', [filePath])` starts macOS's built-in audio player as a separate child process.  
The Node.js application keeps running while `afplay` plays the file in the background.  
The `'close'` event fires when the song finishes, which triggers auto-next in `index.js`.

```js
currentProcess = spawn('afplay', [filePath]);

currentProcess.on('close', function (code) {
  if (code === 0) callbacks.onFinish(); // natural end → auto-next
});
```

### Process management — pause, resume, stop (`player.js`)

The child process can be controlled using Unix signals:

| Signal | Effect |
|---|---|
| `SIGSTOP` | Freezes the `afplay` process mid-playback |
| `SIGCONT` | Resumes a frozen process from the exact position |
| `SIGTERM` | Kills the process (stops playback) |

One important rule: a `SIGSTOP`'d process cannot receive `SIGTERM`. The `stop()` function always sends `SIGCONT` first if the player is paused, then kills the process.

```js
function stop() {
  if (state === STATE.PAUSED) currentProcess.kill('SIGCONT');
  currentProcess.kill(); // SIGTERM
}
```

A **generation counter** prevents stale callbacks. Each call to `play()` increments `generation`. The `onFinish` closure only fires if its captured generation still matches the current one — so rapidly skipping songs never accidentally triggers auto-next from an old process.

---

## Known Limitations

- **macOS only.** Playback relies on `afplay`, which is not available on Linux or Windows.
- **MP3 only.** The song scanner only looks for `.mp3` files.
- **No volume control.** `afplay` volume flags are not wired in.
- **No seek.** Jumping to a specific position in a song is not supported.
- **Song list is fixed at startup.** Files added to `songs/` after launching the app are not detected until it is restarted.
