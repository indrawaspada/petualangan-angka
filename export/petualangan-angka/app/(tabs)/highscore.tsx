import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayers } from "@/src/context/PlayerContext";
import { getHighscores, HighscoreRow } from "@/src/db/database";
import {
  currentPeriod,
  DIFFICULTIES,
  Difficulty,
  OPERATIONS,
  Operation,
  operationSymbol,
} from "@/src/game/gameRules";
import { makeStyles } from "@/src/theme";

type Scope = "all" | "month";

export default function HighscoreScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { activePlayer } = usePlayers();

  const [scope, setScope] = useState<Scope>("all");
  const [operation, setOperation] = useState<Operation>("add");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [rows, setRows] = useState<HighscoreRow[]>([]);

  const load = useCallback(() => {
    const period = currentPeriod();
    getHighscores(scope, operation, difficulty, period).then(setRows);
  }, [scope, operation, difficulty]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title} testID="highscore-title">
          Papan Highscore
        </Text>

        {/* Scope tabs */}
        <View style={styles.scopeRow}>
          {([
            { key: "all", label: "Sepanjang Masa" },
            { key: "month", label: "Bulan Ini" },
          ] as const).map((s) => {
            const selected = s.key === scope;
            return (
              <Pressable
                key={s.key}
                onPress={() => setScope(s.key)}
                style={[styles.scopeTab, selected && styles.scopeTabSelected]}
                testID={`scope-${s.key}`}
              >
                <Text style={[styles.scopeText, selected && styles.scopeTextSelected]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Operation filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRowContent}
          style={styles.chipRow}
        >
          {OPERATIONS.map((op) => {
            const selected = op.key === operation;
            return (
              <Pressable
                key={op.key}
                onPress={() => setOperation(op.key)}
                style={[styles.chip, selected && styles.chipSelected]}
                testID={`filter-op-${op.key}`}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {op.symbol} {op.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Difficulty filter */}
        <View style={styles.diffRow}>
          {DIFFICULTIES.map((d) => {
            const selected = d.key === difficulty;
            return (
              <Pressable
                key={d.key}
                onPress={() => setDifficulty(d.key)}
                style={[styles.diffChip, selected && styles.diffChipSelected]}
                testID={`filter-diff-${d.key}`}
              >
                <Text style={[styles.diffText, selected && styles.diffTextSelected]}>
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.caption}>
          {operationSymbol(operation)} · hanya sesi Tantangan yang selesai
        </Text>

        {/* List */}
        {rows.length === 0 ? (
          <View style={styles.emptyCard} testID="highscore-empty">
            <Text style={styles.emptyText}>
              Belum ada skor. Selesaikan sesi Tantangan untuk masuk peringkat.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rows.map((r) => {
              const isActive = activePlayer?.id === r.playerId;
              return (
                <View
                  key={r.playerId}
                  style={[styles.rowItem, isActive && styles.rowItemActive]}
                  testID={`highscore-row-${r.playerId}`}
                >
                  <Text style={[styles.rank, isActive && styles.rankActive]}>#{r.rank}</Text>
                  <Text
                    style={[styles.name, isActive && styles.nameActive]}
                    numberOfLines={1}
                  >
                    {r.nickname}
                    {isActive ? "  (kamu)" : ""}
                  </Text>
                  <Text style={[styles.score, isActive && styles.scoreActive]}>{r.score}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, gap: 4 },
  title: { fontSize: 28, fontWeight: "800", color: colors.onSurface, marginBottom: 12 },
  scopeRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  scopeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  scopeTabSelected: { backgroundColor: colors.brandPrimary },
  scopeText: { fontSize: 15, fontWeight: "700", color: colors.onSurfaceTertiary },
  scopeTextSelected: { color: colors.onBrandPrimary },
  chipRow: { marginTop: 16, maxHeight: 56 },
  chipRowContent: { gap: 10, paddingRight: 8, alignItems: "center" },
  chip: {
    flexShrink: 0,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: { borderColor: colors.brandPrimary, backgroundColor: colors.surfaceTertiary },
  chipText: { fontSize: 14, fontWeight: "700", color: colors.onSurfaceSecondary },
  chipTextSelected: { color: colors.brandPrimary },
  diffRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  diffChip: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  diffChipSelected: { borderColor: colors.brandSecondary, backgroundColor: colors.brandTertiary },
  diffText: { fontSize: 14, fontWeight: "700", color: colors.onSurfaceSecondary },
  diffTextSelected: { color: colors.onBrandTertiary },
  caption: { fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 6 },
  emptyCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
  },
  emptyText: { fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 22 },
  list: { marginTop: 8, gap: 8 },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowItemActive: { borderColor: colors.brandPrimary, backgroundColor: colors.surfaceTertiary },
  rank: { width: 48, fontSize: 16, fontWeight: "800", color: colors.muted },
  rankActive: { color: colors.brandPrimary },
  name: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.onSurface },
  nameActive: { color: colors.brandPrimary },
  score: { fontSize: 18, fontWeight: "800", color: colors.onSurface },
  scoreActive: { color: colors.brandPrimary },
}));
