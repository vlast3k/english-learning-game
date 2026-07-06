# Testing

Use one command for the full local validation:

```sh
npm test
```

That runs:

- `npm run test:assets` for sprite-sheet metrics and JavaScript syntax.
- `npm run test:browser` for a live Phaser smoke test in system Chrome.

The browser test starts its own local HTTP server on a random free port, disables cache, opens `phaser.html`, drives the hero through side/up/down movement, verifies frame changes and body motion, and writes screenshots to `test-results/browser-smoke/`.

Useful variants:

```sh
npm run test:browser
BROWSER_CHANNEL=chrome npm run test:browser
HEADLESS=false npm run test:browser
```

The default browser channel is `chrome` to avoid depending on Playwright's downloaded Chromium binary.

## Manual level testing

Start the local server:

```sh
npm run serve
```

Open Level 1:

```text
http://localhost:9231/phaser.html?level=1&reset=1
```

Open Level 2 directly from a clean test state:

```text
http://localhost:9231/phaser.html?level=2&reset=1
```

`level=2` selects the Level 2 scenario. `reset=1` clears the current tab's campaign state before the ECA engine starts, so stale completed puzzles or inventory from another run do not leak into the test.
