// Web fallback for the on-device store. The native build uses real SQLite
// (database.ts); Metro auto-picks THIS file on web, where expo-sqlite's wasm
// worker is not available. Data is persisted in localStorage so the preview
// and the automated tests behave like the native app.

import { Difficulty, Operation } from "@/src/game/gameRules";
import {
  assignRanks,
  HighscoreRow,
  Player,
  ProgressSummary,
  SessionResult,
} from "@/src/db/types";

export type { Player, SessionResult, ProgressSummary, HighscoreRow } from "@/src/db/types";

const PLAYERS_KEY = "pa_web_players";
const SESSIONS_KEY = "pa_web_sessions";

function readPlayers(): Player[] {
  try {
    return JSON.parse(window.localStorage.getItem(PLAYERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writePlayers(players: Player[]): void {
  window.localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}
function readSessions(): SessionResult[] {
  try {
    return JSON.parse(window.localStorage.getItem(SESSIONS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writeSessions(sessions: SessionResult[]): void {
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listPlayers(): Promise<Player[]> {
  return [...readPlayers()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function addPlayer(
  nicknameRaw: string,
): Promise<{ ok: boolean; error?: string; player?: Player }> {
  const nickname = nicknameRaw.trim();
  if (nickname.length === 0) {
    return { ok: false, error: "Nama panggilan tidak boleh kosong." };
  }
  const players = readPlayers();
  if (players.some((p) => p.nickname.toLowerCase() === nickname.toLowerCase())) {
    return { ok: false, error: "Nama panggilan sudah dipakai." };
  }
  const player: Player = {
    id: makeId(),
    nickname,
    created_at: new Date().toISOString(),
  };
  players.push(player);
  writePlayers(players);
  return { ok: true, player };
}

export async function saveSession(s: SessionResult): Promise<void> {
  const sessions = readSessions();
  // Prevent a duplicate save of the same session id.
  if (sessions.some((x) => x.id === s.id)) return;
  sessions.push(s);
  writeSessions(sessions);
}

export async function getProgress(playerId: string): Promise<ProgressSummary> {
  const mine = readSessions().filter((s) => s.player_id === playerId && s.completed === 1);
  const bestScores: Record<string, number> = {};
  let totalCorrect = 0;
  let totalWrong = 0;
  for (const s of mine) {
    totalCorrect += s.correct;
    totalWrong += s.wrong;
    if (s.mode === "challenge") {
      const key = `${s.operation}_${s.difficulty}`;
      bestScores[key] = Math.max(bestScores[key] ?? 0, s.score);
    }
  }
  return {
    sessionsCompleted: mine.length,
    totalCorrect,
    totalWrong,
    bestScores,
  };
}

export async function getHighscores(
  scope: "all" | "month",
  operation: Operation,
  difficulty: Difficulty,
  period: string,
): Promise<HighscoreRow[]> {
  const players = readPlayers();
  const nameById = new Map(players.map((p) => [p.id, p.nickname]));

  const eligible = readSessions().filter(
    (s) =>
      s.mode === "challenge" &&
      s.completed === 1 &&
      s.operation === operation &&
      s.difficulty === difficulty &&
      (scope === "all" || s.period === period) &&
      nameById.has(s.player_id),
  );

  const bestByPlayer = new Map<string, number>();
  for (const s of eligible) {
    bestByPlayer.set(s.player_id, Math.max(bestByPlayer.get(s.player_id) ?? 0, s.score));
  }

  const rows = [...bestByPlayer.entries()]
    .map(([playerId, score]) => ({
      playerId,
      nickname: nameById.get(playerId) ?? "",
      score,
    }))
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));

  return assignRanks(rows);
}
