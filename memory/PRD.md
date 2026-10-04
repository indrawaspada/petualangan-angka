# PRD — Petualangan Angka (Offline Math Game)

## Original Problem Statement
Build a minimum, offline Android app "Petualangan Angka" with Expo + React Native + TypeScript.
Fully on-device, no backend/FastAPI/MongoDB. Indonesian language, simple UI, minimal dependencies,
large buttons. Core: local player profiles, math game (4 operations × 2 difficulties, practice +
60s challenge), per-player progress, and a local highscore board (All-time + current month).

## User Choices
- Difficulty ranges: Mudah 0–20, Sulit 0–50 (mul/div operands capped at 10/12 for sensible answers).
- Theme: bright kid-friendly blue/green (light only).
- Navigation: bottom tabs — Beranda, Highscore, Pemain.

## Architecture
- **100% on-device, no backend.** The template's FastAPI/Mongo is unused and not depended upon.
- **Storage**: native uses local **SQLite** (`expo-sqlite`, `src/db/database.ts`). Web preview uses a
  localStorage fallback with an identical API (`src/db/database.web.ts`, Metro auto-picks `.web.ts`)
  because expo-sqlite's wasm worker can't load in a browser. Shared types + ranking in `src/db/types.ts`.
- **Separation of concerns**: question engine (`src/game/questionEngine.ts`), game rules/constants
  (`src/game/gameRules.ts`), storage access (`src/db/*`), active-player state (`src/context/PlayerContext.tsx`).
- Progress and highscores are **computed from stored session results**; sessions saved exactly once
  (unique session id + `INSERT OR IGNORE` on native / id de-dupe on web).
- Challenge timer is **wall-clock based** (`Date.now()`), so elapsed time keeps counting while the app
  is backgrounded; on foreground it recomputes and ends if time is up.

## Screens
- Pemain: add (unique nickname) + select active player.
- Beranda: operation/difficulty/mode selectors, progress summary, start, highscore link.
- Game: question, 4 unique options, feedback + correct answer, practice "Selesai" / challenge timer.
- Result: active player name, score (challenge), benar/salah, Main Lagi / Beranda.
- Highscore: Sepanjang Masa + Bulan Ini tabs, operation + difficulty filters, ranked rows, active highlighted.

## Implemented (2026-10-04)
- [x] Local player profiles with permanent ids, unique nickname, active selection, separate per-player data.
- [x] Math game: add/sub/mul/div, 2 difficulties, 4 unique options (exactly one correct), practice + 60s challenge, +10/correct.
- [x] Correctness rules: no negative subtraction, integer division with no zero divisor.
- [x] Per-player progress (sessions completed, total correct/wrong, best score per operation+difficulty).
- [x] Local highscore board: all-time + current month, filters, only completed challenge sessions, ties share rank, active highlighted, YYYY-MM period stored at completion.
- [x] Persistence across restarts; abandoned sessions not ranked; no double-save.
- [x] Verified by testing agent (27/27 flows pass).

## Android — Dependencies & Permissions
- **Added dependency**: `expo-sqlite`. Everything else is from the base template
  (expo, expo-router, react-native, react-native-safe-area-context, etc.).
- **Android permissions required: NONE.** No camera/mic/contacts/location/email/DOB.

## Build instructions (brief)
- Use the Emergent **Publish** button (top-right) to deploy, then generate Android builds:
  a **test APK** for sideloading and a **production AAB** for Play Store, by supplying the requested
  credentials in the build panel. (No EAS CLI / external tooling needed.)

## Backlog (not in this version, do not add without request)
- P2: Monthly archive viewer for past months.
- P2: Edit/delete player.
- P2: Per-operation session length options for practice.

## Known Issues
- None open. (Web preview is a convenience only; the deliverable is the native Android build using SQLite.)
