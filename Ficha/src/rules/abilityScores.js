// src/rules/abilityScores.js

const COST_TABLE = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9
};

export function calculatePointBuy(scores) {
  let spent = 0;

  for (const key in scores) {
    const val = scores[key];
    spent += COST_TABLE[val] ?? 0;
  }

  return { spent };
}

export function abilityModifier(score) {
  return Math.floor((score - 10) / 2);
}
