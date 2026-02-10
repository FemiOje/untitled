/**
 * Game Director Context
 *
 * Orchestrates game state, entity synchronization, and event processing
 * Following death-mountain pattern for game director
 */

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useController } from "./controller";
import { useGameStore, initializePlayerState } from "@/stores/gameStore";
import { useUIStore } from "@/stores/uiStore";
import { usePlayerEntitySync, useRefreshPlayerState } from "@/dojo/useEntitySync";
import { useStarknetApi } from "@/api/starknet";
import { GameEvent } from "@/types/game";
import { debugLog } from "@/utils/helpers";

export interface GameDirectorContext {
  isInitialized: boolean;
  initializeGame: () => Promise<void>;
  processEvent: (event: GameEvent) => void;
  refreshGameState: () => Promise<void>;
}

const GameDirectorContext = createContext<GameDirectorContext>(
  {} as GameDirectorContext
);

/**
 * Game Director Provider
 * Manages game initialization, state synchronization, and event processing
 */
export const GameDirectorProvider = ({ children }: PropsWithChildren) => {
  const { address, account } = useController();
  const { getPlayerState } = useStarknetApi();
  const { refreshState } = useRefreshPlayerState();

  const {
    playerAddress,
    setPlayerAddress,
    setPosition,
    setMoves,
    setIsSpawned,
    setIsInitializing,
    addEvent,
    resetGameState,
  } = useGameStore();

  const { setError, clearError } = useUIStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Enable entity sync when player is connected
  usePlayerEntitySync();

  /**
   * Initialize game state when wallet connects
   */
  useEffect(() => {
    if (address && address !== playerAddress) {
      debugLog("Wallet connected, initializing game state", address);
      initializeGame();
    } else if (!address && playerAddress) {
      debugLog("Wallet disconnected, resetting game state");
      resetGameState();
      setPlayerAddress(null);
      setIsInitialized(false);
    }
  }, [address, playerAddress]);

  /**
   * Initialize game state from blockchain
   */
  const initializeGame = useCallback(async () => {
    if (!address) {
      console.warn("Cannot initialize game: no address");
      return;
    }

    try {
      setIsInitializing(true);
      clearError();

      debugLog("Initializing game for player", address);

      // Set player address in store
      initializePlayerState(address);

      // Fetch initial state from blockchain
      const state = await getPlayerState(address);

      if (state.position) {
        debugLog("Player position found", state.position);
        setPosition(state.position);
        setIsSpawned(true);
      } else {
        debugLog("Player not spawned yet");
        setIsSpawned(false);
      }

      if (state.moves) {
        debugLog("Player moves state found", state.moves);
        setMoves(state.moves);
      }

      // Trigger entity sync refresh
      await refreshState();

      setIsInitialized(true);
      debugLog("Game initialization complete");
    } catch (error) {
      console.error("Error initializing game:", error);
      setError("Failed to initialize game state");
    } finally {
      setIsInitializing(false);
    }
  }, [
    address,
    getPlayerState,
    setPosition,
    setMoves,
    setIsSpawned,
    setIsInitializing,
    refreshState,
    clearError,
    setError,
  ]);

  /**
   * Process game event and update state
   * @param event - GameEvent to process
   */
  const processEvent = useCallback(
    (event: GameEvent) => {
      debugLog("Processing game event", event);

      // Add event to log
      addEvent(event);

      // Update state based on event type
      switch (event.type) {
        case "spawned":
          if (event.position) {
            setPosition(event.position);
            setIsSpawned(true);

            // Initialize Moves state - contract creates Moves with can_move: true during spawn
            setMoves({
              player: event.position.player,
              last_direction: null,
              can_move: true,
            });

            debugLog("Player spawned at", event.position.vec);
          }
          break;

        case "moved":
          if (event.position) {
            setPosition(event.position);
            debugLog("Player moved to", event.position.vec);
          }
          if (event.moves) {
            setMoves(event.moves);
          }
          break;

        case "position_update":
          if (event.position) {
            setPosition(event.position);
            debugLog("Position updated", event.position.vec);
          }
          break;

        default:
          debugLog("Unhandled event type", event.type);
      }
    },
    [addEvent, setPosition, setMoves, setIsSpawned]
  );

  /**
   * Manually refresh game state from blockchain
   */
  const refreshGameState = useCallback(async () => {
    if (!address) {
      console.warn("Cannot refresh: no address");
      return;
    }

    try {
      debugLog("Manually refreshing game state");

      // Fetch fresh state
      const state = await getPlayerState(address);

      if (state.position) {
        setPosition(state.position);
        setIsSpawned(true);
      }

      if (state.moves) {
        setMoves(state.moves);
      }

      // Trigger entity sync
      await refreshState();

      debugLog("Game state refreshed successfully");
    } catch (error) {
      console.error("Error refreshing game state:", error);
      setError("Failed to refresh game state");
    }
  }, [
    address,
    getPlayerState,
    setPosition,
    setMoves,
    setIsSpawned,
    refreshState,
    setError,
  ]);

  return (
    <GameDirectorContext.Provider
      value={{
        isInitialized,
        initializeGame,
        processEvent,
        refreshGameState,
      }}
    >
      {children}
    </GameDirectorContext.Provider>
  );
};

/**
 * Hook to access Game Director
 */
export const useGameDirector = () => {
  const context = useContext(GameDirectorContext);
  if (!context) {
    throw new Error(
      "useGameDirector must be used within a GameDirectorProvider"
    );
  }
  return context;
};
