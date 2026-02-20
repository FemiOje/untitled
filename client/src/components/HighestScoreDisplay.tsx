/**
 * HighestScoreDisplay Component
 *
 * Displays the current highest scoring player on the leaderboard
 * Shows player username (or address) and XP
 */

import { useHighestScore } from "@/stores/gameStore";
import { shortAddress } from "@/utils/helpers";

export const HighestScoreDisplay = () => {
  const highestScore = useHighestScore();

  if (!highestScore) {
    return (
      <div
        style={{
          padding: "16px",
          border: "1px solid rgba(68, 204, 68, 0.3)",
          borderRadius: 4,
          textAlign: "center",
          color: "rgba(68, 204, 68, 0.6)",
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        No scores yet
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        border: "2px solid #44cc44",
        borderRadius: 4,
        background: "rgba(68, 204, 68, 0.05)",
        fontFamily: "monospace",
        fontSize: 12,
      }}
    >
      <div style={{ marginBottom: 8, color: "#44cc44", fontWeight: 600 }}>
        HIGHEST SCORE
      </div>
      <div style={{ marginBottom: 6, color: "#e0e0e0" }}>
        <strong>{highestScore.username}</strong>
      </div>
      <div style={{ color: "#44cc44", fontWeight: 600 }}>
        {highestScore.xp} XP
      </div>
      <div
        style={{ marginTop: 8, fontSize: 10, color: "rgba(68, 204, 68, 0.7)" }}
      >
        {shortAddress(highestScore.player)}
      </div>
    </div>
  );
};
