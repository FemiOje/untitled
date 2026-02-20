/**
 * Entity Synchronization Hooks
 *
 * Real-time entity subscriptions using Dojo SDK
 * Following death-mountain pattern for entity sync
 */

import { useEffect, useCallback, useRef } from "react";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useGameStore } from "@/stores/gameStore";
import { useController } from "@/contexts/controller";
import { Position, Moves, Direction } from "@/types/game";
import { isValidPositionObject } from "@/utils/position";

/**
 * Hook to subscribe to player position updates
 * NOTE: These hooks are currently unused - Torii indexer is down.
 * Game state is managed via direct RPC calls through GameDirector.
 */

export const usePlayerPositionSync = () => {
  const { address } = useController();
  const { useDojoStore } = useDojoSDK();
  const entities = useDojoStore((state) => state.entities);
  const { setPosition, setIsSpawned, setIsSyncing } = useGameStore();
  const lastSyncRef = useRef<number>(0);

  // Subscribe to Position entity for this player
  // useEntityQuery(
  //   new ToriiQueryBuilder()
  //     .withClause(
  //       KeysClause(
  //         ["untitled-Position"],
  //         [`${address || "0x0"}`],
  //         "FixedLen"
  //       ).build()
  //     )
  //     .includeHashedKeys()
  // );

  // Process entity updates
  useEffect(() => {
    if (!address || !entities) return;

    const processPositionUpdate = async () => {
      try {
        setIsSyncing(true);

        // Find position entity for this player
        const entityArray = Object.values(entities);
        const positionEntity = entityArray.find((entity: any) => {
          const models = entity?.models || {};
          const positionModel = Object.values(models).find(
            (model: any) =>
              model?.player?.toLowerCase() === address.toLowerCase() &&
              model?.vec !== undefined
          );
          return positionModel !== undefined;
        });

        if (positionEntity) {
          const models = (positionEntity as any).models || {};
          const positionModel: any = Object.values(models).find(
            (model: any) => model?.vec !== undefined
          );

          if (positionModel && positionModel.vec) {
            const position: Position = {
              player: address,
              vec: {
                x: positionModel.vec.x || 0,
                y: positionModel.vec.y || 0,
              },
            };

            // Only update if position is valid and not too frequent
            if (
              isValidPositionObject(position) &&
              Date.now() - lastSyncRef.current > 100
            ) {
              setPosition(position);
              setIsSpawned(true);
              lastSyncRef.current = Date.now();
            }
          }
        }
      } catch (error) {
        console.error("Error syncing position:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    processPositionUpdate();
  }, [entities, address, setPosition, setIsSpawned, setIsSyncing]);
};

/**
 * Hook to subscribe to player moves updates
 * Automatically syncs moves state from blockchain to game store
 */
export const usePlayerMovesSync = () => {
  const { address } = useController();
  const { useDojoStore } = useDojoSDK();
  const entities = useDojoStore((state) => state.entities);
  const { setMoves, setIsSyncing } = useGameStore();
  const lastSyncRef = useRef<number>(0);

  // Process entity updates
  useEffect(() => {
    if (!address || !entities) return;

    const processMovesUpdate = async () => {
      try {
        setIsSyncing(true);

        // Find moves entity for this player
        const entityArray = Object.values(entities);
        // console.log("🔍 Searching for Moves entity. Total entities:", entityArray.length);

        const movesEntity = entityArray.find((entity: any) => {
          const models = entity?.models || {};
          const movesModel = Object.values(models).find(
            (model: any) =>
              model?.player?.toLowerCase() === address.toLowerCase() &&
              model?.can_move !== undefined
          );
          return movesModel !== undefined;
        });

        if (movesEntity) {
          const models = (movesEntity as any).models || {};
          const movesModel: any = Object.values(models).find(
            (model: any) => model?.can_move !== undefined
          );

          if (movesModel) {
            const moves: Moves = {
              player: address,
              last_direction:
                typeof movesModel.last_direction === "number" &&
                movesModel.last_direction > 0
                  ? (movesModel.last_direction as Direction)
                  : null,
              can_move: movesModel.can_move === true,
            };

            // Only update if not too frequent
            if (
              Date.now() - lastSyncRef.current > 100
            ) {
              setMoves(moves);
              lastSyncRef.current = Date.now();
            }
          }
        } else {
          // console.warn("⚠️ No Moves entity found for player:", address);
        }
      } catch (error) {
        console.error("Error syncing moves:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    processMovesUpdate();
  }, [entities, address, setMoves, setIsSyncing]);
};

/**
 * Hook to sync all player entities
 * Combines position and moves syncing
 */
export const usePlayerEntitySync = () => {
  usePlayerPositionSync();
  usePlayerMovesSync();
};

/**
 * Hook to manually fetch and sync player state
 * Useful for force refreshing state
 */
export const useRefreshPlayerState = () => {
  const { address } = useController();
  const { useDojoStore } = useDojoSDK();
  const entities = useDojoStore((state) => state.entities);
  const { setPosition, setMoves, setIsSpawned, setIsSyncing } = useGameStore();

  const refreshState = useCallback(async () => {
    if (!address || !entities) return;

    try {
      setIsSyncing(true);

      const entityArray = Object.values(entities);

      // Find and process all relevant entities
      let positionFound = false;
      let movesFound = false;

      for (const entity of entityArray) {
        const models = (entity as any)?.models || {};

        // Log all models in this entity
        // Check for position model
        for (const model of Object.values(models)) {
          const m = model as any;

          if (
            m?.player?.toLowerCase() === address.toLowerCase() &&
            m?.vec !== undefined
          ) {
            const position: Position = {
              player: address,
              vec: {
                x: m.vec.x || 0,
                y: m.vec.y || 0,
              },
            };
            setPosition(position);
            setIsSpawned(true);
            positionFound = true;
          }

          if (
            m?.player?.toLowerCase() === address.toLowerCase() &&
            m?.can_move !== undefined
          ) {
            const moves: Moves = {
              player: address,
              last_direction:
                typeof m.last_direction === "number" && m.last_direction > 0
                  ? (m.last_direction as Direction)
                  : null,
              can_move: m.can_move === true,
            };
            setMoves(moves);
            movesFound = true;
          }
        }
      }

      if (!positionFound && !movesFound) {
        // console.error("❌ No player state found in entities");
        // debugLog("No player state found in entities");
      }
    } catch (error) {
      console.error("Error refreshing player state:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [address, entities, setPosition, setMoves, setIsSpawned, setIsSyncing]);

  return { refreshState };
};
