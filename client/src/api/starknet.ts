/**
 * Starknet API Utilities
 *
 * Direct RPC calls to fetch game state from contracts
 * Following death-mountain pattern for data fetching
 */

import { useDynamicConnector } from "@/starknet-provider";
import { getContractAddress } from "@/utils/networkConfig";
import { Position, Moves } from "@/types/game";
import { num } from "starknet";

/**
 * Hook for Starknet API calls
 */
export const useStarknetApi = () => {
  const { currentNetworkConfig } = useDynamicConnector();

  /**
   * Get player position from contract
   * Direct RPC call to fetch Position model
   *
   * @param playerAddress - Player's contract address
   * @returns Position object or null
   */
  const getPlayerPosition = async (
    playerAddress: string
  ): Promise<Position | null> => {
    try {
      const response = await fetch(currentNetworkConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "starknet_call",
          params: [
            {
              contract_address: currentNetworkConfig.manifest.world.address,
              entry_point_selector: num.toHex(
                "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e"
              ), // get selector
              calldata: [playerAddress],
            },
            "latest",
          ],
          id: 0,
        }),
      });

      const data = await response.json();

      if (!data?.result || data.result.length < 2) {
        return null;
      }

      return {
        player: playerAddress,
        vec: {
          x: parseInt(data.result[0], 16),
          y: parseInt(data.result[1], 16),
        },
      };
    } catch (error) {
      console.error("Error fetching player position:", error);
      return null;
    }
  };

  /**
   * Get player moves state from contract
   * Direct RPC call to fetch Moves model
   *
   * @param playerAddress - Player's contract address
   * @returns Moves object or null
   */
  const getPlayerMoves = async (
    playerAddress: string
  ): Promise<Moves | null> => {
    try {
      const response = await fetch(currentNetworkConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "starknet_call",
          params: [
            {
              contract_address: currentNetworkConfig.manifest.world.address,
              entry_point_selector: num.toHex(
                "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e"
              ), // get selector
              calldata: [playerAddress],
            },
            "latest",
          ],
          id: 0,
        }),
      });

      const data = await response.json();

      if (!data?.result || data.result.length < 2) {
        return null;
      }

      const lastDirection = parseInt(data.result[0], 16);
      const canMove = parseInt(data.result[1], 16) === 1;

      return {
        player: playerAddress,
        last_direction: lastDirection > 0 ? lastDirection : null,
        can_move: canMove,
      };
    } catch (error) {
      console.error("Error fetching player moves:", error);
      return null;
    }
  };

  /**
   * Get complete player state
   * Fetches both position and moves in parallel
   *
   * @param playerAddress - Player's contract address
   * @returns Object with position and moves
   */
  const getPlayerState = async (playerAddress: string) => {
    try {
      const [position, moves] = await Promise.all([
        getPlayerPosition(playerAddress),
        getPlayerMoves(playerAddress),
      ]);

      return {
        position,
        moves,
      };
    } catch (error) {
      console.error("Error fetching player state:", error);
      return {
        position: null,
        moves: null,
      };
    }
  };

  return {
    getPlayerPosition,
    getPlayerMoves,
    getPlayerState,
  };
};
