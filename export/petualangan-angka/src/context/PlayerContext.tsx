// Active player state. Players are stored in SQLite; the chosen active player
// id is persisted in local key-value storage so it survives app restarts.

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { addPlayer as dbAddPlayer, listPlayers, Player } from "@/src/db/database";
import { storage } from "@/src/utils/storage";

const ACTIVE_KEY = "active_player_id";

type PlayerContextValue = {
  ready: boolean;
  players: Player[];
  activePlayer: Player | null;
  reloadPlayers: () => Promise<Player[]>;
  addPlayer: (
    nickname: string,
  ) => Promise<{ ok: boolean; error?: string; player?: Player }>;
  selectPlayer: (id: string) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const reloadPlayers = useCallback(async () => {
    const list = await listPlayers();
    setPlayers(list);
    return list;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await reloadPlayers();
        const storedId = await storage.getItem<string | null>(ACTIVE_KEY, null);
        if (storedId && list.some((p) => p.id === storedId)) {
          setActiveId(storedId);
        } else if (list.length > 0) {
          setActiveId(list[0].id);
          await storage.setItem(ACTIVE_KEY, list[0].id);
        }
      } finally {
        setReady(true);
      }
    })();
  }, [reloadPlayers]);

  const selectPlayer = useCallback(async (id: string) => {
    setActiveId(id);
    await storage.setItem(ACTIVE_KEY, id);
  }, []);

  const addPlayer = useCallback(
    async (nickname: string) => {
      const res = await dbAddPlayer(nickname);
      if (res.ok && res.player) {
        await reloadPlayers();
        await selectPlayer(res.player.id);
      }
      return res;
    },
    [reloadPlayers, selectPlayer],
  );

  const activePlayer = players.find((p) => p.id === activeId) ?? null;

  return (
    <PlayerContext.Provider
      value={{ ready, players, activePlayer, reloadPlayers, addPlayer, selectPlayer }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayers(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayers must be used within PlayerProvider");
  return ctx;
}
