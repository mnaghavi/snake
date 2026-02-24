export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OPPOSITE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

export function createInitialState({
  cols = 18,
  rows = 18,
  direction = "right",
  seed = 0
} = {}) {
  const midX = Math.floor(cols / 2);
  const midY = Math.floor(rows / 2);
  const snake = [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY }
  ];

  const initial = {
    cols,
    rows,
    snake,
    direction,
    nextDirection: direction,
    score: 0,
    gameOver: false,
    paused: false,
    seed: seed >>> 0,
    food: { x: 0, y: 0 }
  };

  const spawn = spawnFood(initial);
  return { ...initial, food: spawn.food, seed: spawn.seed };
}

export function setDirection(state, candidate) {
  if (state.gameOver || state.paused || !DIRECTIONS[candidate]) {
    return state;
  }

  if (candidate === OPPOSITE[state.direction]) {
    return state;
  }

  return { ...state, nextDirection: candidate };
}

export function togglePause(state) {
  if (state.gameOver) return state;
  return { ...state, paused: !state.paused };
}

export function step(state) {
  if (state.gameOver || state.paused) return state;

  const direction = state.nextDirection;
  const vector = DIRECTIONS[direction];
  const currentHead = state.snake[0];
  const nextHead = {
    x: currentHead.x + vector.x,
    y: currentHead.y + vector.y
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.cols ||
    nextHead.y >= state.rows;

  if (hitWall) {
    return { ...state, direction, gameOver: true };
  }

  const willEat = nextHead.x === state.food.x && nextHead.y === state.food.y;
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  const hitSelf = bodyToCheck.some((s) => s.x === nextHead.x && s.y === nextHead.y);

  if (hitSelf) {
    return { ...state, direction, gameOver: true };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willEat) {
    nextSnake.pop();
  }

  if (!willEat) {
    return {
      ...state,
      direction,
      snake: nextSnake
    };
  }

  const grownState = {
    ...state,
    direction,
    snake: nextSnake,
    score: state.score + 1
  };

  const spawn = spawnFood(grownState);
  return {
    ...grownState,
    food: spawn.food,
    seed: spawn.seed
  };
}

export function spawnFood(state) {
  const occupied = new Set(state.snake.map((part) => `${part.x},${part.y}`));
  const freeCells = [];

  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return { food: state.food, seed: state.seed };
  }

  const { value, seed } = nextRandom(state.seed);
  const idx = Math.floor(value * freeCells.length);
  return {
    food: freeCells[idx],
    seed
  };
}

export function nextRandom(seed) {
  const nextSeed = ((seed >>> 0) * 1664525 + 1013904223) >>> 0;
  return {
    value: nextSeed / 4294967296,
    seed: nextSeed
  };
}
