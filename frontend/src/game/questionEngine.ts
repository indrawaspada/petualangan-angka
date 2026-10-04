// Question engine: builds a correct math problem for the chosen operation and
// difficulty, plus exactly four unique answer options (one correct).

import {
  Difficulty,
  Operation,
  RANGES,
  operationSymbol,
} from "@/src/game/gameRules";

export type Question = {
  operation: Operation;
  difficulty: Difficulty;
  a: number;
  b: number;
  symbol: string;
  text: string;
  correct: number;
  options: number[];
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build 4 unique, non-negative options that include `correct`.
export function buildOptions(correct: number): number[] {
  const set = new Set<number>([correct]);
  let spread = 2;
  let guard = 0;
  while (set.size < 4) {
    guard++;
    const delta = randInt(1, Math.max(4, Math.ceil(Math.abs(correct) * 0.4)) + spread);
    const sign = Math.random() < 0.5 ? -1 : 1;
    let cand = correct + sign * delta;
    if (cand < 0) cand = correct + delta;
    set.add(cand);
    spread++;
    // Deterministic fallback so the loop always terminates.
    if (guard > 40) set.add(correct + guard - 38);
  }
  return shuffle([...set]);
}

export function generateQuestion(
  operation: Operation,
  difficulty: Difficulty,
): Question {
  const { addSubMax, factorMax } = RANGES[difficulty];
  let a = 0;
  let b = 0;
  let correct = 0;

  switch (operation) {
    case "add": {
      a = randInt(0, addSubMax);
      b = randInt(0, addSubMax);
      correct = a + b;
      break;
    }
    case "sub": {
      // No negative results: ensure a >= b.
      a = randInt(0, addSubMax);
      b = randInt(0, a);
      correct = a - b;
      break;
    }
    case "mul": {
      a = randInt(0, factorMax);
      b = randInt(0, factorMax);
      correct = a * b;
      break;
    }
    case "div": {
      // Integer result, no zero divisor.
      b = randInt(1, factorMax);
      const q = randInt(0, factorMax);
      a = b * q;
      correct = q;
      break;
    }
  }

  const symbol = operationSymbol(operation);
  return {
    operation,
    difficulty,
    a,
    b,
    symbol,
    text: `${a} ${symbol} ${b}`,
    correct,
    options: buildOptions(correct),
  };
}
