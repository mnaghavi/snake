import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  setDirection,
  spawnFood,
  step
} from "./snakeLogic.js";

test("snake moves one cell in current direction", () => {
  const initial = createInitialState({ cols: 10, rows: 10, seed: 5 });
  const next = step(initial);

  assert.deepEqual(next.snake[0], {
    x: initial.snake[0].x + 1,
    y: initial.snake[0].y
  });
  assert.equal(next.score, 0);
});

test("snake grows and score increments when eating food", () => {
  const initial = createInitialState({ cols: 10, rows: 10, seed: 5 });
  const head = initial.snake[0];
  const forced = {
    ...initial,
    food: { x: head.x + 1, y: head.y }
  };

  const next = step(forced);

  assert.equal(next.snake.length, initial.snake.length + 1);
  assert.equal(next.score, 1);
  assert.notDeepEqual(next.food, forced.food);
});

test("wall collision triggers game over", () => {
  let state = createInitialState({ cols: 4, rows: 4, seed: 3 });
  state = { ...state, snake: [{ x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }] };

  const next = step(state);
  assert.equal(next.gameOver, true);
});

test("cannot reverse direction immediately", () => {
  const initial = createInitialState({ cols: 10, rows: 10, direction: "right", seed: 2 });
  const turned = setDirection(initial, "left");
  assert.equal(turned.nextDirection, "right");
});

test("spawnFood never places on snake body", () => {
  const state = {
    cols: 3,
    rows: 3,
    snake: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 2, y: 2 }
    ],
    direction: "right",
    nextDirection: "right",
    score: 0,
    gameOver: false,
    paused: false,
    seed: 42,
    food: { x: 0, y: 0 }
  };

  const result = spawnFood(state);
  assert.deepEqual(result.food, { x: 1, y: 2 });
});
