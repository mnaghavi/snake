import test from "node:test";
import assert from "node:assert/strict";
import {
  createGhostCells,
  evaluateAchievements
} from "./gameMeta.js";

test("evaluateAchievements unlocks milestones once", () => {
  const first = evaluateAchievements(6, []);
  assert.deepEqual(first.newlyUnlocked, ["starter", "muncher"]);

  const second = evaluateAchievements(6, first.unlockedIds);
  assert.deepEqual(second.newlyUnlocked, []);
});

test("createGhostCells tracks unique head positions", () => {
  const cells = createGhostCells([
    { snake: [{ x: 1, y: 1 }], food: { x: 0, y: 0 } },
    { snake: [{ x: 2, y: 1 }], food: { x: 0, y: 0 } },
    { snake: [{ x: 2, y: 1 }], food: { x: 0, y: 0 } }
  ]);

  assert.equal(cells.size, 2);
  assert.equal(cells.has("1,1"), true);
  assert.equal(cells.has("2,1"), true);
});
