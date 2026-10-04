// Local SQLite storage layer. All gameplay data lives on-device — no backend.
// Players and session results are stored here; progress & highscores are
// computed from stored session results.

import * as SQLite from "expo-sqlite";

import { Difficulty, Operation } from "@/src/game/gameRules";
import {
  assignRanks,
  HighscoreRow,
  Player,
  ProgressSummary,
  SessionResult,
} from "@/src/db/types";

export type { Player, SessionResult, ProgressSummary, HighscoreRow } from "@/src/db/types";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("petualangan_angka.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY NOT NULL,
      nickname TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      player_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      mode TEXT NOT NULL,
      score INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      wrong INTEGER NOT NULL,
      completed INTEGER NOT NULL,
      period TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export async function listPlayers(): Promise<Player[]> {
  const db = await getDb();
  return db.getAllAsync<Player>(
    "SELECT id, nickname, created_at FROM players ORDER BY created_at ASC",
  );
}

export async function addPlayer(
  nicknameRaw: string,
): Promise<{ ok: boolean; error?: string; player?: Player }> {
  const nickname = nicknameRaw.trim();
  if (nickname.length === 0) {
    return { ok: false, error: "Nama panggilan tidak boleh kosong." };
  }
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM players WHERE lower(nickname) = lower(?)",
    [nickname],
  );
  if (existing) {
    return { ok: false, error: "Nama panggilan sudah dipakai." };
  }
  const player: Player = {
    id: makeId(),
    nickname,
    created_at: new Date().toISOString(),
  };
  await db.runAsync(
    "INSERT INTO players (id, nickname, created_at) VALUES (?, ?, ?)",
    [player.id, player.nickname, player.created_at],
  );
  return { ok: true, player };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

// Stores a completed session exactly once (INSERT OR IGNORE on primary key
// prevents a duplicate save of the same session id).
export async function saveSession(s: SessionResult): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO sessions
      (id, player_id, operation, difficulty, mode, score, correct, wrong, completed, period, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      s.id,
      s.player_id,
      s.operation,
      s.difficulty,
      s.mode,
      s.score,
      s.correct,
      s.wrong,
      s.completed,
      s.period,
      s.created_at,
    ],
  );
}

// ---------------------------------------------------------------------------
// Progress (computed from stored sessions)
// ---------------------------------------------------------------------------

export async function getProgress(playerId: string): Promise<ProgressSummary> {
  const db = await getDb();
  const totals = await db.getFirstAsync<{
    sessionsCompleted: number;
    totalCorrect: number;
    totalWrong: number;
  }>(
    `SELECT
       COUNT(*) AS sessionsCompleted,
       COALESCE(SUM(correct), 0) AS totalCorrect,
       COALESCE(SUM(wrong), 0) AS totalWrong
     FROM sessions
     WHERE player_id = ? AND completed = 1`,
    [playerId],
  );

  const bestRows = await db.getAllAsync<{
    operation: string;
    difficulty: string;
    best: number;
  }>(
    `SELECT operation, difficulty, MAX(score) AS best
     FROM sessions
     WHERE player_id = ? AND completed = 1 AND mode = 'challenge'
     GROUP BY operation, difficulty`,
    [playerId],
  );

  const bestScores: Record<string, number> = {};
  for (const r of bestRows) {
    bestScores[`${r.operation}_${r.difficulty}`] = r.best;
  }

  return {
    sessionsCompleted: totals?.sessionsCompleted ?? 0,
    totalCorrect: totals?.totalCorrect ?? 0,
    totalWrong: totals?.totalWrong ?? 0,
    bestScores,
  };
}

// ---------------------------------------------------------------------------
// Highscores (only normally-completed challenge sessions)
// ---------------------------------------------------------------------------

export async function getHighscores(
  scope: "all" | "month",
  operation: Operation,
  difficulty: Difficulty,
  period: string,
): Promise<HighscoreRow[]> {
  const db = await getDb();
  const where = [
    "s.mode = 'challenge'",
    "s.completed = 1",
    "s.operation = ?",
    "s.difficulty = ?",
  ];
  const params: (string | number)[] = [operation, difficulty];
  if (scope === "month") {
    where.push("s.period = ?");
    params.push(period);
  }

  const rows = await db.getAllAsync<{
    playerId: string;
    nickname: string;
    score: number;
  }>(
    `SELECT p.id AS playerId, p.nickname AS nickname, MAX(s.score) AS score
     FROM sessions s
     JOIN players p ON p.id = s.player_id
     WHERE ${where.join(" AND ")}
     GROUP BY p.id
     ORDER BY score DESC, p.nickname ASC`,
    params,
  );

  // Equal scores share the same rank (standard competition ranking).
  return assignRanks(rows);
}
