import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayers } from "@/src/context/PlayerContext";
import { getProgress, ProgressSummary } from "@/src/db/database";
import {
  DIFFICULTIES,
  Difficulty,
  MODES,
  Mode,
  OPERATIONS,
  Operation,
  difficultyLabel,
} from "@/src/game/gameRules";
import { makeStyles, useTheme } from "@/src/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { activePlayer } = usePlayers();

  const [operation, setOperation] = useState<Operation>("add");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<Mode>("practice");
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (activePlayer) {
        getProgress(activePlayer.id).then((p) => {
          if (active) setProgress(p);
        });
      } else {
        setProgress(null);
      }
      return () => {
        active = false;
      };
    }, [activePlayer]),
  );

  const bestKey = `${operation}_${difficulty}`;
  const bestScore = progress?.bestScores[bestKey] ?? 0;

  const startGame = () => {
    router.push({
      pathname: "/game",
      params: { operation, difficulty, mode },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.appTitle} testID="home-title">
          Petualangan Angka
        </Text>
        {activePlayer ? (
          <Text style={styles.playerLine} testID="home-active-player">
            Pemain: {activePlayer.nickname}
          </Text>
        ) : null}

        {!activePlayer ? (
          <Pressable
            style={styles.warnCard}
            onPress={() => router.push("/(tabs)/players")}
            testID="home-pick-player"
          >
            <Text style={styles.warnTitle}>Pilih pemain dulu</Text>
            <Text style={styles.warnText}>
              Buka tab Pemain untuk menambah atau memilih pemain aktif.
            </Text>
          </Pressable>
        ) : null}

        {/* Operation */}
        <Text style={styles.sectionLabel}>Operasi</Text>
        <View style={styles.opGrid}>
          {OPERATIONS.map((op) => {
            const selected = op.key === operation;
            return (
              <Pressable
                key={op.key}
                onPress={() => setOperation(op.key)}
                style={[styles.opButton, selected && styles.opButtonSelected]}
                testID={`op-${op.key}`}
              >
                <Text style={[styles.opSymbol, selected && styles.opSymbolSelected]}>
                  {op.symbol}
                </Text>
                <Text style={[styles.opLabel, selected && styles.opLabelSelected]}>
                  {op.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Difficulty */}
        <Text style={styles.sectionLabel}>Tingkat Kesulitan</Text>
        <View style={styles.segmentRow}>
          {DIFFICULTIES.map((d) => {
            const selected = d.key === difficulty;
            return (
              <Pressable
                key={d.key}
                onPress={() => setDifficulty(d.key)}
                style={[styles.segment, selected && styles.segmentSelected]}
                testID={`diff-${d.key}`}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Mode */}
        <Text style={styles.sectionLabel}>Mode</Text>
        <View style={styles.segmentRow}>
          {MODES.map((m) => {
            const selected = m.key === mode;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                style={[styles.segment, selected && styles.segmentSelected]}
                testID={`mode-${m.key}`}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {m.label}
                </Text>
                <Text style={[styles.segmentSub, selected && styles.segmentSubSelected]}>
                  {m.desc}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Progress summary */}
        {activePlayer ? (
          <View style={styles.progressCard} testID="home-progress">
            <Text style={styles.progressTitle}>Ringkasan Progres</Text>
            <View style={styles.progressRow}>
              <ProgressStat label="Sesi selesai" value={progress?.sessionsCompleted ?? 0} />
              <ProgressStat label="Benar" value={progress?.totalCorrect ?? 0} />
              <ProgressStat label="Salah" value={progress?.totalWrong ?? 0} />
            </View>
            <Text style={styles.bestLine}>
              Skor terbaik ({difficultyLabel(difficulty)}):{" "}
              <Text style={styles.bestValue}>{bestScore}</Text>
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={startGame}
          disabled={!activePlayer}
          style={[styles.startButton, !activePlayer && styles.startButtonDisabled]}
          testID="start-game-button"
        >
          <Text style={styles.startText}>Mulai Bermain</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/highscore")}
          style={styles.linkButton}
          testID="home-open-highscore"
        >
          <Text style={styles.linkText}>Lihat Papan Highscore →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );

  function ProgressStat({ label, value }: { label: string; value: number }) {
    return (
      <View style={styles.stat}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    );
  }
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, gap: 8 },
  appTitle: { fontSize: 28, fontWeight: "800", color: colors.onSurface },
  playerLine: { fontSize: 16, color: colors.muted, marginBottom: 8 },
  warnCard: {
    backgroundColor: colors.brandTertiary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  warnTitle: { fontSize: 16, fontWeight: "800", color: colors.onBrandTertiary },
  warnText: { fontSize: 14, color: colors.onBrandTertiary, marginTop: 4 },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  opGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  opButton: {
    width: "47%",
    flexGrow: 1,
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  opButtonSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.surfaceTertiary,
  },
  opSymbol: { fontSize: 26, fontWeight: "800", color: colors.muted },
  opSymbolSelected: { color: colors.brandPrimary },
  opLabel: { fontSize: 14, fontWeight: "700", color: colors.onSurfaceSecondary, marginTop: 2 },
  opLabelSelected: { color: colors.onSurface },
  segmentRow: { flexDirection: "row", gap: 12 },
  segment: {
    flex: 1,
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.surfaceTertiary,
  },
  segmentText: { fontSize: 16, fontWeight: "800", color: colors.onSurfaceSecondary },
  segmentTextSelected: { color: colors.brandPrimary },
  segmentSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  segmentSubSelected: { color: colors.onSurfaceSecondary },
  progressCard: {
    marginTop: 20,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTitle: { fontSize: 16, fontWeight: "800", color: colors.onSurface, marginBottom: 12 },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 24, fontWeight: "800", color: colors.brandPrimary },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  bestLine: { marginTop: 14, fontSize: 14, color: colors.onSurfaceSecondary },
  bestValue: { fontWeight: "800", color: colors.brandSecondary },
  startButton: {
    marginTop: 24,
    backgroundColor: colors.brandPrimary,
    borderRadius: 18,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonDisabled: { backgroundColor: colors.borderStrong },
  startText: { fontSize: 20, fontWeight: "800", color: colors.onBrandPrimary },
  linkButton: { marginTop: 14, alignItems: "center", paddingVertical: 8 },
  linkText: { fontSize: 15, fontWeight: "700", color: colors.brandPrimary },
}));
