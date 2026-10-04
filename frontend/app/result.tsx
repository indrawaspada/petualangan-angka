import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Difficulty,
  difficultyLabel,
  Mode,
  modeLabel,
  Operation,
  operationLabel,
} from "@/src/game/gameRules";
import { makeStyles } from "@/src/theme";

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const router = useRouter();

  const params = useLocalSearchParams<{
    operation: Operation;
    difficulty: Difficulty;
    mode: Mode;
    score: string;
    correct: string;
    wrong: string;
    player: string;
  }>();

  const operation = (params.operation ?? "add") as Operation;
  const difficulty = (params.difficulty ?? "easy") as Difficulty;
  const mode = (params.mode ?? "practice") as Mode;
  const score = Number(params.score ?? 0);
  const correct = Number(params.correct ?? 0);
  const wrong = Number(params.wrong ?? 0);
  const player = params.player ?? "";
  const isChallenge = mode === "challenge";

  const playAgain = () => {
    router.replace({
      pathname: "/game",
      params: { operation, difficulty, mode },
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.body}>
        <Text style={styles.title} testID="result-title">
          Hasil
        </Text>
        <Text style={styles.player} testID="result-player">
          {player}
        </Text>
        <Text style={styles.meta}>
          {operationLabel(operation)} · {difficultyLabel(difficulty)} · {modeLabel(mode)}
        </Text>

        <View style={styles.card}>
          {isChallenge ? (
            <>
              <Text style={styles.scoreLabel}>Skor</Text>
              <Text style={styles.scoreValue} testID="result-score">
                {score}
              </Text>
            </>
          ) : (
            <Text style={styles.practiceNote}>Mode Latihan selesai</Text>
          )}
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValueOk} testID="result-correct">
                {correct}
              </Text>
              <Text style={styles.statLabel}>Benar</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValueNo} testID="result-wrong">
                {wrong}
              </Text>
              <Text style={styles.statLabel}>Salah</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={playAgain} style={styles.primaryButton} testID="result-play-again">
          <Text style={styles.primaryText}>Main Lagi</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          style={styles.secondaryButton}
          testID="result-home"
        >
          <Text style={styles.secondaryText}>Beranda</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  body: { alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: colors.muted },
  player: { fontSize: 30, fontWeight: "800", color: colors.onSurface, marginTop: 4 },
  meta: { fontSize: 15, color: colors.muted, marginTop: 6, textAlign: "center" },
  card: {
    marginTop: 28,
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreLabel: { fontSize: 16, fontWeight: "700", color: colors.muted },
  scoreValue: { fontSize: 72, fontWeight: "800", color: colors.brandPrimary, marginTop: 4 },
  practiceNote: { fontSize: 20, fontWeight: "800", color: colors.onSurface },
  statRow: { flexDirection: "row", gap: 48, marginTop: 24 },
  stat: { alignItems: "center" },
  statValueOk: { fontSize: 36, fontWeight: "800", color: colors.success },
  statValueNo: { fontSize: 36, fontWeight: "800", color: colors.error },
  statLabel: { fontSize: 14, color: colors.muted, marginTop: 2 },
  actions: { gap: 12 },
  primaryButton: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 18,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontSize: 20, fontWeight: "800", color: colors.onBrandPrimary },
  secondaryButton: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  secondaryText: { fontSize: 18, fontWeight: "800", color: colors.onSurface },
}));
