export const ACHIEVEMENTS = [
  { id: "starter", title: "Starter", target: 3 },
  { id: "muncher", title: "Muncher", target: 6 },
  { id: "hunter", title: "Hunter", target: 10 },
  { id: "legend", title: "Legend", target: 15 }
];

export function evaluateAchievements(score, unlockedIds = []) {
  const unlocked = new Set(unlockedIds);
  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (score >= achievement.target && !unlocked.has(achievement.id)) {
      unlocked.add(achievement.id);
      newlyUnlocked.push(achievement.id);
    }
  }

  return {
    unlockedIds: [...unlocked],
    newlyUnlocked
  };
}

export function createGhostCells(frames) {
  const cells = new Set();
  for (const frame of frames) {
    if (!frame || !frame.snake || frame.snake.length === 0) continue;
    const head = frame.snake[0];
    cells.add(`${head.x},${head.y}`);
  }
  return cells;
}

export function cloneFrame(state) {
  return {
    snake: state.snake.map((part) => ({ x: part.x, y: part.y })),
    food: { x: state.food.x, y: state.food.y }
  };
}
