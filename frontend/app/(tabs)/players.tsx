import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayers } from "@/src/context/PlayerContext";
import { makeStyles, useTheme } from "@/src/theme";

export default function PlayersScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { players, activePlayer, addPlayer, selectPlayer } = usePlayers();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null);
    const res = await addPlayer(name);
    if (!res.ok) {
      setError(res.error ?? "Gagal menambah pemain.");
      return;
    }
    setName("");
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title} testID="players-title">
          Pemain
        </Text>
        <Text style={styles.subtitle}>
          Tambah pemain baru lalu pilih pemain aktif untuk bermain.
        </Text>

        <View style={styles.addCard}>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (error) setError(null);
            }}
            placeholder="Nama panggilan"
            placeholderTextColor={colors.muted}
            style={styles.input}
            maxLength={16}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            testID="player-name-input"
          />
          <Pressable style={styles.addButton} onPress={handleAdd} testID="add-player-button">
            <Text style={styles.addButtonText}>Tambah</Text>
          </Pressable>
        </View>
        {error ? (
          <Text style={styles.errorText} testID="player-error">
            {error}
          </Text>
        ) : null}

        <Text style={styles.sectionLabel}>Daftar Pemain</Text>
        {players.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada pemain. Tambahkan satu di atas.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {players.map((p) => {
              const isActive = activePlayer?.id === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => selectPlayer(p.id)}
                  style={[styles.playerRow, isActive && styles.playerRowActive]}
                  testID={`player-row-${p.id}`}
                >
                  <View style={styles.radioOuter}>
                    {isActive ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={[styles.playerName, isActive && styles.playerNameActive]}>
                    {p.nickname}
                  </Text>
                  {isActive ? <Text style={styles.activeTag}>Aktif</Text> : null}
                </Pressable>
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
  content: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: "800", color: colors.onSurface },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 4, marginBottom: 20 },
  addCard: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.onSurface,
  },
  addButton: {
    height: 54,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { fontSize: 16, fontWeight: "800", color: colors.onBrandPrimary },
  errorText: { color: colors.error, fontSize: 14, marginTop: 8, fontWeight: "600" },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
    marginTop: 24,
    marginBottom: 10,
  },
  emptyCard: { backgroundColor: colors.surfaceSecondary, borderRadius: 16, padding: 20 },
  emptyText: { fontSize: 15, color: colors.muted, textAlign: "center" },
  list: { gap: 10 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  playerRowActive: { borderColor: colors.brandPrimary, backgroundColor: colors.surfaceTertiary },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brandPrimary,
  },
  playerName: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.onSurface },
  playerNameActive: { color: colors.brandPrimary },
  activeTag: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.onBrandSecondary,
    backgroundColor: colors.brandSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
}));
