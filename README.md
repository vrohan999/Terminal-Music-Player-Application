# Terminal Music Player

A simple, interactive music player that runs in the terminal. Built with Node.js using only built-in modules — no npm packages required.

---

## Features

- Browse a numbered list of all MP3 files in the `songs/` folder
- Play, pause, resume, and stop songs
- Skip to the next or previous song
- Automatically plays the next song when the current one finishes
- Wraps around from the last song back to the first (and vice versa)
- Clean full-screen terminal UI that refreshes on every action
- Graceful handling of missing files and invalid input

---

## Requirements

| Requirement | Details |
|---|---|
| **Operating system** | macOS (uses the built-in `afplay` command for audio) |
| **Node.js** | v14 or later |
| **npm packages** | None — only Node's built-in modules are used |

---

## Project Structure

```
Terminal-Music-Player/
├── songs/          Place your .mp3 files here
├── index.js        Entry point — coordinates the application
├── player.js       Audio playback via child_process.spawn()
├── ui.js           Terminal display and screen rendering
├── handleKey.js    Reads user input with readline
├── package.json
└── README.md
```

Each file has one clear responsibility so the code is easy to follow.

---

## Setup

No installation step is needed. Clone or download the project and run it:

```bash
node index.js
```

---

## How to Add Songs

1. Copy any `.mp3` files into the `songs/` folder.
2. Run `node index.js`. The player scans the folder on startup.
3. Song titles are displayed without the `.mp3` extension.

Only `.mp3` files are recognised. Other file types in `songs/` are ignored.

---

## Running the Application

```bash
node index.js
```

The terminal clears and shows the player UI:

```
╔══════════════════════════════════════════╗
║       🎵  TERMINAL MUSIC PLAYER          ║
╚══════════════════════════════════════════╝

  Songs
  ──────────────────────────────────────────

    1. Believer
  ▶ 2. Blinding Lights
    3. Perfect
    4. Starboy

  Now Playing : Blinding Lights
  Status      : ▶  PLAYING

  Commands
  ──────────────────────────────────────────

  [number]  Play song    n  Next song
  p         Pause        b  Previous song
  r         Resume       s  Stop
  h         Refresh      q  Quit

>
```

Type a command and press **Enter**. Press **Ctrl+C** or type `q` to quit.

---

## Command List

| Command | Action |
|---|---|
| `1`, `2`, … | Play the song with that number |
| `n` | Skip to the next song |
| `b` | Go back to the previous song |
| `p` | Pause the current song |
| `r` | Resume a paused song |
| `s` | Stop playback |
| `h` | Refresh the screen |
| `q` | Quit the player |
| Ctrl+C | Quit the player |

Commands are case-insensitive. Extra spaces are ignored.

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
  .map(file => path.basename(file, '.mp3'));
```

### `readline` — reading user input (`handleKey.js`)

`readline.createInterface()` wraps `process.stdin` and gives us a `> ` prompt.  
The `'line'` event fires every time the user presses Enter.  
The input is trimmed and lowercased before being passed to the command handler in `index.js`.

```js
rl.on('line', function (line) {
  const input = line.trim().toLowerCase();
  if (input !== '') onCommand(input);
  rl.prompt();
});
```

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
