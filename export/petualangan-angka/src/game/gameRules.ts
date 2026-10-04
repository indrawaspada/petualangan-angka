// Pure game rules & constants for "Petualangan Angka".
// No side effects, no storage. Keeps the question engine & scoring testable.

export type Operation = "add" | "sub" | "mul" | "div";
export type Difficulty = "easy" | "hard";
export type Mode = "practice" | "challenge";

export const OPERATIONS: { key: Operation; label: string; symbol: string }[] = [
  { key: "add", label: "Penjumlahan", symbol: "+" },
  { key: "sub", label: "Pengurangan", symbol: "−" },
  { key: "mul", label: "Perkalian", symbol: "×" },
  { key: "div", label: "Pembagian", symbol: "÷" },
];

export const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "easy", label: "Mudah" },
  { key: "hard", label: "Sulit" },
];

export const MODES: { key: Mode; label: string; desc: string }[] = [
  { key: "practice", label: "Latihan", desc: "Tanpa waktu" },
  { key: "challenge", label: "Tantangan", desc: "60 detik" },
];

// Fixed number ranges per difficulty (user choice: Mudah 0-20, Sulit 0-50).
// For multiplication/division operands are kept smaller so answers stay sensible.
export const RANGES: Record<Difficulty, { addSubMax: number; factorMax: number }> = {
  easy: { addSubMax: 20, factorMax: 10 },
  hard: { addSubMax: 50, factorMax: 12 },
};

export const CHALLENGE_DURATION = 60; // seconds
export const CORRECT_POINTS = 10;

export function operationLabel(op: Operation): string {
  return OPERATIONS.find((o) => o.key === op)?.label ?? op;
}
export function operationSymbol(op: Operation): string {
  return OPERATIONS.find((o) => o.key === op)?.symbol ?? "?";
}
export function difficultyLabel(d: Difficulty): string {
  return DIFFICULTIES.find((x) => x.key === d)?.label ?? d;
}
export function modeLabel(m: Mode): string {
  return MODES.find((x) => x.key === m)?.label ?? m;
}

// Local-time period key YYYY-MM, stored when a session completes.
export function currentPeriod(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
