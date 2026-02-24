# Snake Ghost Challenge

A minimal classic Snake game with two upgrades:
- Achievement milestones
- Last-run ghost path + replay

## Tech
- Plain HTML/CSS/JavaScript
- No external runtime dependencies
- Node built-in test runner for logic tests

## Run locally
1. Start a static server from this repo:
   ```bash
   python3 -m http.server 5173
   ```
2. Open:
   http://localhost:5173

## Controls
- Move: Arrow keys or WASD
- Pause/Resume: Space or Pause button
- Restart: Restart button
- Replay previous run: `R` key or `Replay Last Run` button

## Test
If Node is installed:
```bash
node --test
```
