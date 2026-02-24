import {
  createInitialState,
  setDirection,
  step,
  togglePause
} from "./snakeLogic.js";
import {
  ACHIEVEMENTS,
  cloneFrame,
  createGhostCells,
  evaluateAchievements
} from "./gameMeta.js";

const BOARD_SIZE = 18;
const TICK_MS = 140;
const REPLAY_TICK_MS = 90;
const ACHIEVEMENTS_KEY = "snake_achievements_v1";

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const pauseBtn = document.getElementById("pause");
const replayBtn = document.getElementById("replay");
const achievementListEl = document.getElementById("achievement-list");
const touchButtons = document.querySelectorAll("[data-dir]");

let state = createInitialState({ cols: BOARD_SIZE, rows: BOARD_SIZE, seed: 1 });
let timerId = null;
let replayTimerId = null;
let replayActive = false;
let runFrames = [];
let lastRunFrames = [];
let ghostCells = new Set();
let unlockedAchievementIds = new Set(loadAchievements());

function indexForCell(x, y) {
  return y * state.cols + x;
}

function loadAchievements() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => ACHIEVEMENTS.some((a) => a.id === id));
  } catch {
    return [];
  }
}

function persistAchievements(ids) {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage failures to avoid interrupting gameplay.
  }
}

function buildBoard() {
  boardEl.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;
  boardEl.innerHTML = "";

  for (let i = 0; i < state.cols * state.rows; i += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    boardEl.appendChild(cell);
  }
}

function renderAchievements() {
  achievementListEl.innerHTML = "";

  for (const item of ACHIEVEMENTS) {
    const li = document.createElement("li");
    const unlocked = unlockedAchievementIds.has(item.id);
    li.className = unlocked ? "unlocked" : "";
    li.textContent = unlocked
      ? `${item.title} unlocked (${item.target})`
      : `${item.title}: score ${item.target}`;
    achievementListEl.appendChild(li);
  }
}

function drawCells(frame, { replay = false } = {}) {
  const cells = boardEl.children;

  for (let i = 0; i < cells.length; i += 1) {
    cells[i].className = "cell";
  }

  if (!replay) {
    for (const cell of ghostCells) {
      const [x, y] = cell.split(",").map(Number);
      const ghostIndex = indexForCell(x, y);
      if (cells[ghostIndex]) {
        cells[ghostIndex].classList.add("ghost");
      }
    }
  }

  const foodIndex = indexForCell(frame.food.x, frame.food.y);
  if (cells[foodIndex]) {
    cells[foodIndex].classList.add("food");
  }

  frame.snake.forEach((part, idx) => {
    const cellIndex = indexForCell(part.x, part.y);
    if (!cells[cellIndex]) return;
    if (replay) {
      cells[cellIndex].classList.add(idx === 0 ? "replay-head" : "replay-body");
      return;
    }

    cells[cellIndex].classList.add("snake");
    if (idx === 0) {
      cells[cellIndex].classList.add("head");
    }
  });
}

function updateAchievementProgress() {
  const evaluation = evaluateAchievements(state.score, [...unlockedAchievementIds]);
  if (evaluation.newlyUnlocked.length === 0) {
    return;
  }

  unlockedAchievementIds = new Set(evaluation.unlockedIds);
  persistAchievements(evaluation.unlockedIds);
  renderAchievements();

  const latestId = evaluation.newlyUnlocked[evaluation.newlyUnlocked.length - 1];
  const achievement = ACHIEVEMENTS.find((item) => item.id === latestId);
  if (achievement && !state.gameOver) {
    statusEl.textContent = `Achievement: ${achievement.title}`;
  }
}

function render() {
  drawCells(state);
  scoreEl.textContent = String(state.score);
  replayBtn.disabled = lastRunFrames.length === 0 || replayActive;

  if (state.gameOver) {
    statusEl.textContent = `Game Over (Last run: ${state.score})`;
    pauseBtn.disabled = true;
    return;
  }

  pauseBtn.disabled = false;
  if (state.paused) {
    statusEl.textContent = "Paused";
  } else if (lastRunFrames.length > 0) {
    const lastScore = lastRunFrames[lastRunFrames.length - 1].snake.length - 3;
    statusEl.textContent = `Running (Beat last run: ${Math.max(lastScore, 0)})`;
  } else {
    statusEl.textContent = "Running";
  }
  pauseBtn.textContent = state.paused ? "Resume" : "Pause";
}

function finalizeRun() {
  if (runFrames.length <= 1) return;
  lastRunFrames = runFrames;
  ghostCells = createGhostCells(lastRunFrames);
}

function tick() {
  if (replayActive) return;
  if (state.paused || state.gameOver) {
    render();
    return;
  }

  const wasGameOver = state.gameOver;
  state = step(state);
  runFrames.push(cloneFrame(state));
  updateAchievementProgress();

  if (!wasGameOver && state.gameOver) {
    finalizeRun();
  }

  render();
}

function startLoop() {
  if (timerId) clearInterval(timerId);
  timerId = setInterval(tick, TICK_MS);
}

function stopReplay() {
  if (replayTimerId) {
    clearInterval(replayTimerId);
    replayTimerId = null;
  }
  replayActive = false;
}

function restart() {
  stopReplay();
  finalizeRun();
  state = createInitialState({ cols: BOARD_SIZE, rows: BOARD_SIZE, seed: 1 });
  pauseBtn.textContent = "Pause";
  runFrames = [cloneFrame(state)];
  buildBoard();
  render();
  startLoop();
}

function startReplay() {
  if (lastRunFrames.length === 0 || replayActive) return;

  replayActive = true;
  state = { ...state, paused: true };
  pauseBtn.textContent = "Resume";
  statusEl.textContent = "Replaying last run";

  let frameIndex = 0;

  replayTimerId = setInterval(() => {
    const frame = lastRunFrames[frameIndex];
    if (!frame) {
      stopReplay();
      render();
      return;
    }

    drawCells(frame, { replay: true });
    frameIndex += 1;

    if (frameIndex >= lastRunFrames.length) {
      stopReplay();
      render();
    }
  }, REPLAY_TICK_MS);
}

function onDirection(direction) {
  if (replayActive) return;
  state = setDirection(state, direction);
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "r"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowup" || key === "w") onDirection("up");
  if (key === "arrowdown" || key === "s") onDirection("down");
  if (key === "arrowleft" || key === "a") onDirection("left");
  if (key === "arrowright" || key === "d") onDirection("right");

  if (key === " ") {
    if (!replayActive) {
      state = togglePause(state);
      render();
    }
  }

  if (key === "r") {
    startReplay();
  }
});

touchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    onDirection(button.dataset.dir);
  });
});

restartBtn.addEventListener("click", restart);

pauseBtn.addEventListener("click", () => {
  if (replayActive) return;
  state = togglePause(state);
  render();
});

replayBtn.addEventListener("click", startReplay);

renderAchievements();
restart();
