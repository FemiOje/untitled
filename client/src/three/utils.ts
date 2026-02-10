import { HEX_SIZE } from "./constants";
import * as THREE from "three";

export interface HexPosition {
  col: number;
  row: number;
}

/**
 * Converts hex coordinates (col, row) to 3D world position
 * Uses pure axial coordinates (q, r) for pointy-top hexagons
 * This matches the contract's coordinate system exactly
 */
export const getWorldPositionForHex = (hexCoords: HexPosition): THREE.Vector3 => {
  const size = HEX_SIZE;
  const q = hexCoords.col;
  const r = hexCoords.row;

  // Axial to pixel conversion for pointy-top hexagons
  // x = size * sqrt(3) * (q + r/2)
  // z = size * 3/2 * r
  const x = size * Math.sqrt(3) * (q + r / 2);
  const z = size * (3 / 2) * r;

  return new THREE.Vector3(x, 0, z);
};

/**
 * Converts 3D world position to hex coordinates
 * Uses pure axial coordinate inverse conversion with proper hex rounding
 */
export const getHexForWorldPosition = (worldPosition: { x: number; y: number; z: number }): HexPosition => {
  const size = HEX_SIZE;

  // Pixel to axial conversion for pointy-top hexagons
  // q = (sqrt(3)/3 * x - 1/3 * z) / size
  // r = (2/3 * z) / size
  const q = ((Math.sqrt(3) / 3) * worldPosition.x - (1 / 3) * worldPosition.z) / size;
  const r = ((2 / 3) * worldPosition.z) / size;

  // Proper hex rounding using cube coordinates
  // Convert axial (q, r) to cube (q, r, s) where s = -q - r
  const s = -q - r;

  // Round all three cube coordinates
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  // Calculate rounding errors
  const q_diff = Math.abs(rq - q);
  const r_diff = Math.abs(rr - r);
  const s_diff = Math.abs(rs - s);

  // Adjust the coordinate with the largest rounding error
  // to maintain the constraint q + r + s = 0
  if (q_diff > r_diff && q_diff > s_diff) {
    rq = -rr - rs;
  } else if (r_diff > s_diff) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }

  const result = {
    col: rq,
    row: rr,
  };

  console.log("🎯 getHexForWorldPosition:", {
    worldPosition: { x: worldPosition.x, z: worldPosition.z },
    fractional: { q: q.toFixed(2), r: r.toFixed(2), s: s.toFixed(2) },
    rounded: result,
    errors: { q_diff: q_diff.toFixed(3), r_diff: r_diff.toFixed(3), s_diff: s_diff.toFixed(3) }
  });

  return result;
};
