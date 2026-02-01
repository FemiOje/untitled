/**
 * Coordinate System Mapping
 *
 * Maps between blockchain coordinates and UI coordinates:
 * - Blockchain: Vec2 {x, y} - Axial coordinates (q, r)
 * - UI: HexPosition {col, row} - Also axial coordinates
 *
 * The HexGrid component uses axial coordinates disguised as {col, row},
 * so the mapping is straightforward: x=col, y=row
 *
 * Direction mapping:
 * - Direction.East (1) = Vec2(+1, 0) = HexPosition(+1, 0)
 * - Direction.NorthEast (2) = Vec2(+1, -1) = HexPosition(+1, -1)
 * - Direction.NorthWest (3) = Vec2(0, -1) = HexPosition(0, -1)
 * - Direction.West (4) = Vec2(-1, 0) = HexPosition(-1, 0)
 * - Direction.SouthWest (5) = Vec2(-1, +1) = HexPosition(-1, +1)
 * - Direction.SouthEast (6) = Vec2(0, +1) = HexPosition(0, +1)
 */

import type { Vec2 } from "@/types/game";
import type { HexPosition } from "@/three/utils";

/**
 * Convert blockchain Vec2 coordinates to UI HexPosition
 * @param vec - Blockchain position {x, y}
 * @returns UI position {col, row}
 */
export function vec2ToHexPosition(vec: Vec2): HexPosition {
  return {
    col: vec.x,
    row: vec.y,
  };
}

/**
 * Convert UI HexPosition to blockchain Vec2 coordinates
 * @param hex - UI position {col, row}
 * @returns Blockchain position {x, y}
 */
export function hexPositionToVec2(hex: HexPosition): Vec2 {
  return {
    x: hex.col,
    y: hex.row,
  };
}

/**
 * Calculate which direction represents a move from one position to another
 * Returns null if positions are not adjacent
 * @param from - Starting position
 * @param to - Target position
 * @returns Direction enum value or null
 */
export function calculateDirection(from: HexPosition, to: HexPosition): number | null {
  const dx = to.col - from.col;
  const dy = to.row - from.row;

  // Direction mapping based on Vec2 offsets
  const directionMap: Record<string, number> = {
    "1,0": 1,    // East
    "1,-1": 2,   // NorthEast
    "0,-1": 3,   // NorthWest
    "-1,0": 4,   // West
    "-1,1": 5,   // SouthWest
    "0,1": 6,    // SouthEast
  };

  const key = `${dx},${dy}`;
  return directionMap[key] ?? null;
}

/**
 * Get all adjacent hex positions (6 neighbors)
 * @param pos - Center position
 * @returns Array of 6 neighboring positions
 */
export function getAdjacentHexPositions(pos: HexPosition): HexPosition[] {
  return [
    { col: pos.col + 1, row: pos.row },      // East
    { col: pos.col + 1, row: pos.row - 1 },  // NorthEast
    { col: pos.col, row: pos.row - 1 },      // NorthWest
    { col: pos.col - 1, row: pos.row },      // West
    { col: pos.col - 1, row: pos.row + 1 },  // SouthWest
    { col: pos.col, row: pos.row + 1 },      // SouthEast
  ];
}

/**
 * Check if two hex positions are adjacent (neighbors)
 * @param a - First position
 * @param b - Second position
 * @returns True if positions are neighbors
 */
export function areHexPositionsAdjacent(a: HexPosition, b: HexPosition): boolean {
  return calculateDirection(a, b) !== null;
}
