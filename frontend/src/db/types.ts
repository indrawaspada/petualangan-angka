// Shared data types & pure helpers for the on-device store. Used by both the
// native SQLite implementation (database.ts) and the web fallback
// (database.web.ts) so the two stay in sync.

import { Difficulty, Mode, Operation } from "@/src/game/gameRules";

export type Player = { id: string; nickname: string; created_at: string };

export type SessionResult = {
  id: string;
  player_id: string;
  operation: Operation;
  difficulty: Difficulty;
  mode: Mode;
  score: number;
  correct: number;
  wrong: number;
  completed: number; // 1 = finished normally, 0 = abandoned (never stored)
  period: string; // YYYY-MM local time at completion
  created_at: string;
};

export type ProgressSummary = {
  sessionsCompleted: number;
  totalCorrect: number;
  totalWrong: number;
  bestScores: Record<string, number>; // key: `${operation}_${difficulty}`
};

export type HighscoreRow = {
  rank: number;
  playerId: string;
  nickname: string;
  score: number;
};

// Standard competition ranking: equal scores share the same rank.
// Input must already be sorted by score descending.
export function assignRanks(
  rows: { playerId: string; nickname: string; score: number }[],
): HighscoreRow[] {
  const result: HighscoreRow[] = [];
  let lastScore: number | null = null;
  let lastRank = 0;
  rows.forEach((r, i) => {
    let rank: number;
    if (lastScore !== null && r.score === lastScore) {
      rank = lastRank;
    } else {
      rank = i + 1;
      lastRank = rank;
      lastScore = r.score;
    }
    result.push({ rank, playerId: r.playerId, nickname: r.nickname, score: r.score });
  });
  return result;
}
