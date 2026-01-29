/**
 * GameActions Component
 *
 * Example component demonstrating how to use the death-mountain pattern
 * for game actions in a React component
 */

import { useGameActions } from "@/dojo/useGameActions";
import { Direction } from "@/types/game";
import { Button } from "@mui/material";

export const GameActions = () => {
  const {
    handleSpawn,
    handleMove,
    isSpawning,
    isMoving,
    isLoading,
    lastError,
    clearError,
  } = useGameActions();

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: "rgba(10, 10, 30, 0.9)",
        padding: 24,
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minWidth: 300,
      }}
    >
      {/* Error Display */}
      {lastError && (
        <div
          style={{
            color: "#ff4444",
            padding: 12,
            background: "rgba(255, 68, 68, 0.1)",
            borderRadius: 8,
            fontSize: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{lastError}</span>
          <button
            onClick={clearError}
            style={{
              background: "none",
              border: "none",
              color: "#ff4444",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Spawn Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSpawn}
        disabled={isLoading}
        fullWidth
      >
        {isSpawning ? "Spawning..." : "Spawn Player"}
      </Button>

      {/* Movement Controls */}
      <div style={{ marginTop: 12 }}>
        <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8 }}>
          Movement Controls
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {/* Top Row */}
          <div />
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleMove(Direction.NorthWest)}
            disabled={isLoading}
          >
            NW
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleMove(Direction.NorthEast)}
            disabled={isLoading}
          >
            NE
          </Button>

          {/* Middle Row */}
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleMove(Direction.West)}
            disabled={isLoading}
          >
            W
          </Button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#666",
            }}
          >
            {isMoving ? "Moving..." : "•"}
          </div>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleMove(Direction.East)}
            disabled={isLoading}
          >
            E
          </Button>

          {/* Bottom Row */}
          <div />
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleMove(Direction.SouthWest)}
            disabled={isLoading}
          >
            SW
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleMove(Direction.SouthEast)}
            disabled={isLoading}
          >
            SE
          </Button>
        </div>
      </div>

      {/* Status Text */}
      <div
        style={{
          fontSize: 11,
          color: "#666",
          textAlign: "center",
          marginTop: 8,
        }}
      >
        {isLoading
          ? "Processing transaction..."
          : "Ready for action"}
      </div>
    </div>
  );
};

export default GameActions;
