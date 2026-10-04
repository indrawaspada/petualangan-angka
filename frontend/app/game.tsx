import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayers } from "@/src/context/PlayerContext";
import { makeId, saveSession } from "@/src/db/database";
import {
  CHALLENGE_DURATION,
  CORRECT_POINTS,
  currentPeriod,
  Difficulty,
  Mode,
  Operation,
  operationLabel,
} from "@/src/game/gameRules";
import { generateQuestion, Question } from "@/src/game/questionEngine";
import { makeStyles } from "@/src/theme";

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const router = useRouter();
  const { activePlayer } = usePlayers();

  const params = useLocalSearchParams<{
    operation: Operation;
    difficulty: Difficulty;
    mode: Mode;
  }>();
  const operation = (params.operation ?? "add") as Operation;
  const difficulty = (params.difficulty ?? "easy") as Difficulty;
  const mode = (params.mode ?? "practice") as Mode;
  const isChallenge = mode === "challenge";

  const [question, setQuestion] = useState<Question>(() =>
    generateQuestion(operation, difficulty),
  );
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [questionNo, setQuestionNo] = useState(1);
  const [remaining, setRemaining] = useState(CHALLENGE_DURATION);

  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());
  const finishedRef = useRef(false);
  const sessionIdRef = useRef(makeId());

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const correct = correctRef.current;
    const wrong = wrongRef.current;
    const score = isChallenge ? correct * CORRECT_POINTS : 0;

    if (activePlayer) {
      // Save exactly once (INSERT OR IGNORE + finishedRef guard).
      saveSession({
        id: sessionIdRef.current,
        player_id: activePlayer.id,
        operation,
        difficulty,
        mode,
        score,
        correct,
        wrong,
        completed: 1,
        period: currentPeriod(),
        created_at: new Date().toISOString(),
      });
    }

    router.replace({
      pathname: "/result",
      params: {
        operation,
        difficulty,
        mode,
        score: String(score),
        correct: String(correct),
        wrong: String(wrong),
        player: activePlayer?.nickname ?? "",
      },
    });
  }, [activePlayer, difficulty, isChallenge, mode, operation, router]);

  // Challenge timer: driven by wall-clock so backgrounding still counts time.
  useEffect(() => {
    if (!isChallenge) return;
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const left = Math.max(0, Math.ceil(CHALLENGE_DURATION - elapsed));
      setRemaining(left);
      if (left <= 0) finish();
    };

    tick();
    const interval = setInterval(tick, 250);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") tick();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [isChallenge, finish]);

  // Hardware back = abandon (not saved). finishedRef stops double nav.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      finishedRef.current = true;
      return false; // allow default back
    });
    return () => sub.remove();
  }, []);

  const onSelect = (value: number) => {
    if (answered) return;
    setSelected(value);
    setAnswered(true);
    if (value === question.correct) {
      correctRef.current += 1;
      setCorrectCount((c) => c + 1);
    } else {
      wrongRef.current += 1;
      setWrongCount((w) => w + 1);
    }
  };

  const onNext = () => {
    if (isChallenge && remaining <= 0) {
      finish();
      return;
    }
    setQuestion(generateQuestion(operation, difficulty));
    setSelected(null);
    setAnswered(false);
    setQuestionNo((n) => n + 1);
  };

  const abandon = () => {
    finishedRef.current = true;
    router.back();
  };

  const isCorrect = answered && selected === question.correct;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={abandon} style={styles.exitButton} testID="game-exit-button">
          <Text style={styles.exitText}>Keluar</Text>
        </Pressable>
        <Text style={styles.headerCenter} testID="game-player-name">
          {activePlayer?.nickname ?? ""}
        </Text>
        {isChallenge ? (
          <View style={[styles.timerPill, remaining <= 10 && styles.timerPillLow]}>
            <Text style={styles.timerText} testID="game-timer">
              {remaining}s
            </Text>
          </View>
        ) : (
          <Pressable onPress={finish} style={styles.finishButton} testID="game-finish-button">
            <Text style={styles.finishText}>Selesai</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.subHeader}>
        {operationLabel(operation)} · Soal {questionNo}
      </Text>

      {/* Score / counters */}
      <View style={styles.counters}>
        {isChallenge ? (
          <Text style={styles.scoreNow} testID="game-score">
            Skor: {correctCount * CORRECT_POINTS}
          </Text>
        ) : null}
        <Text style={styles.counterText}>Benar: {correctCount}</Text>
        <Text style={styles.counterText}>Salah: {wrongCount}</Text>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText} testID="game-question">
          {question.text} = ?
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsGrid}>
        {question.options.map((opt) => {
          const isThisCorrect = opt === question.correct;
          const isThisSelected = opt === selected;
          let optStyle = styles.option;
          let txtStyle = styles.optionText;
          if (answered) {
            if (isThisCorrect) {
              optStyle = styles.optionCorrect;
              txtStyle = styles.optionTextLight;
            } else if (isThisSelected) {
              optStyle = styles.optionWrong;
              txtStyle = styles.optionTextLight;
            } else {
              optStyle = styles.optionDim;
            }
          }
          return (
            <Pressable
              key={opt}
              onPress={() => onSelect(opt)}
              disabled={answered}
              style={optStyle}
              testID={`option-${opt}`}
            >
              <Text style={txtStyle}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Feedback + next */}
      <View style={styles.footer}>
        {answered ? (
          <>
            <Text
              style={[styles.feedback, isCorrect ? styles.feedbackOk : styles.feedbackNo]}
              testID="game-feedback"
            >
              {isCorrect ? "Benar!" : `Salah. Jawaban: ${question.correct}`}
            </Text>
            <Pressable onPress={onNext} style={styles.nextButton} testID="game-next-button">
              <Text style={styles.nextText}>Lanjut</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.hint}>Pilih salah satu jawaban</Text>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  exitButton: { paddingVertical: 8, paddingRight: 8, minWidth: 70 },
  exitText: { fontSize: 15, fontWeight: "700", color: colors.muted },
  headerCenter: { fontSize: 16, fontWeight: "800", color: colors.onSurface, flex: 1, textAlign: "center" },
  timerPill: {
    minWidth: 70,
    alignItems: "center",
    backgroundColor: colors.brandPrimary,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timerPillLow: { backgroundColor: colors.error },
  timerText: { fontSize: 16, fontWeight: "800", color: colors.onBrandPrimary },
  finishButton: {
    minWidth: 70,
    alignItems: "center",
    backgroundColor: colors.brandSecondary,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  finishText: { fontSize: 15, fontWeight: "800", color: colors.onBrandSecondary },
  subHeader: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 4 },
  counters: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
    alignItems: "center",
  },
  scoreNow: { fontSize: 16, fontWeight: "800", color: colors.brandPrimary },
  counterText: { fontSize: 14, fontWeight: "700", color: colors.onSurfaceSecondary },
  questionCard: {
    marginTop: 24,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingVertical: 36,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionText: { fontSize: 44, fontWeight: "800", color: colors.onSurface },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 24,
  },
  option: {
    width: "47%",
    flexGrow: 1,
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  optionDim: {
    width: "47%",
    flexGrow: 1,
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
  optionCorrect: {
    width: "47%",
    flexGrow: 1,
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  optionWrong: {
    width: "47%",
    flexGrow: 1,
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { fontSize: 32, fontWeight: "800", color: colors.onSurface },
  optionTextLight: { fontSize: 32, fontWeight: "800", color: colors.onSuccess },
  footer: { marginTop: 24, alignItems: "center", gap: 14 },
  hint: { fontSize: 15, color: colors.muted },
  feedback: { fontSize: 20, fontWeight: "800" },
  feedbackOk: { color: colors.success },
  feedbackNo: { color: colors.error },
  nextButton: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { fontSize: 18, fontWeight: "800", color: colors.onBrandPrimary },
}));
