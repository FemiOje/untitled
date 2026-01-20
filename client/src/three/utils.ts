import { HEX_SIZE } from "./constants";
import * as THREE from "three";

export interface HexPosition {
  col: number;
  row: number;
}

/**
 * Converts hex coordinates (col, row) to 3D world position
 * Uses offset-row layout (odd/even row offset)
 * Based on eternum's implementation
 */
export const getWorldPositionForHex = (hexCoords: HexPosition): THREE.Vector3 => {
  const hexRadius = HEX_SIZE;
  const hexHeight = hexRadius * 2;
  const hexWidth = Math.sqrt(3) * hexRadius;
  const vertDist = hexHeight * 0.75; // 1.5 * HEX_SIZE
  const horizDist = hexWidth; // √3 * HEX_SIZE

  const col = hexCoords.col;
  const row = hexCoords.row;
  
  // Offset rows: odd rows are shifted right by half the horizontal distance
  const rowOffset = ((row % 2) * Math.sign(row) * horizDist) / 2;
  const x = col * horizDist - rowOffset;
  const z = row * vertDist;
  
  return new THREE.Vector3(x, 0, z);
};

/**
 * Converts 3D world position to hex coordinates
 * Based on eternum's implementation
 */
export const getHexForWorldPosition = (worldPosition: { x: number; y: number; z: number }): HexPosition => {
  const hexRadius = HEX_SIZE;
  const hexHeight = hexRadius * 2;
  const hexWidth = Math.sqrt(3) * hexRadius;
  const vertDist = hexHeight * 0.75;
  const horizDist = hexWidth;

  const row = Math.round(worldPosition.z / vertDist);
  const rowOffset = ((row % 2) * Math.sign(row) * horizDist) / 2;
  const col = Math.round((worldPosition.x + rowOffset) / horizDist);

  return {
    col,
    row,
  };
};
