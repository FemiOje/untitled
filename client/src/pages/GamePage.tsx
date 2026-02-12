import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { KeysClause, ToriiQueryBuilder } from "@dojoengine/sdk";
// import { useAccount } from "@starknet-react/core";
import { useEntityQuery } from "@dojoengine/sdk/react";
import { Button } from "@mui/material";
import HexGrid from "../components/HexGrid";
import Header from "../components/Header";
import type { HexPosition } from "../three/utils";
import { useCurrentPosition, useIsSpawned, useCanPlayerMove, usePlayerMoves } from "../stores/gameStore";
import { useGameActions } from "../dojo/useGameActions";
import { useGameDirector } from "../contexts/GameDirector";
import { vec2ToHexPosition, calculateDirection } from "../utils/coordinateMapping";

export default function GamePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshGameState } = useGameDirector();

    // Get game_id from URL
    const gameIdFromUrl = searchParams.get("id");
    const gameId = gameIdFromUrl ? parseInt(gameIdFromUrl, 10) : null;

    // Query all entities - for debugging/overview
    // Note: This can be expensive, use specific queries in production
    useEntityQuery(
        new ToriiQueryBuilder()
            .withClause(
                KeysClause([], [], "VariableLen").build()
            )
            .includeHashedKeys()
    );

    // Get blockchain state
    const blockchainPosition = useCurrentPosition();
    const isSpawned = useIsSpawned();
    const canMove = useCanPlayerMove();
    const moves = usePlayerMoves();
    const { handleMove: handleBlockchainMove, isLoading } = useGameActions();

    // Manual refresh handler
    const handleRefresh = useCallback(async () => {
        console.log("🔄 Manual refresh triggered");
        await refreshGameState();
    }, [refreshGameState]);

    useEffect(() => {
        console.log("GamePage state:", {
            isSpawned,
            blockchainPosition,
            canMove,
            moves,
            isLoading
        });
    }, [isSpawned, blockchainPosition, canMove, moves, isLoading]);

    // URL validation - redirect if no game_id or invalid game_id
    useEffect(() => {
        if (!gameId || gameId <= 0) {
            console.log("No valid game ID in URL, redirecting to start page...");
            navigate("/");
            return;
        }

        // TODO: When game_id is in URL, validate it belongs to connected wallet
        // For now, we'll just check if we're spawned
        // Future: call getGameState(gameId) to verify ownership

        console.log("Game page loaded with game_id:", gameId);
    }, [gameId, navigate]);

    // Convert blockchain Vec2 to HexPosition for display
    const playerPosition: HexPosition = blockchainPosition
        ? vec2ToHexPosition(blockchainPosition)
        : { col: 0, row: 0 };

    // Handle move from HexGrid
    const handleMove = useCallback((targetPos: HexPosition) => {
        console.log("Move attempt:", {
            targetPos,
            blockchainPosition,
            canMove,
            isSpawned
        });

        if (!blockchainPosition) {
            console.warn("Cannot move: player position not available");
            return;
        }

        if (!canMove) {
            console.warn("Cannot move: waiting for cooldown");
            return;
        }

        // Calculate direction from current position to target
        const currentHexPos = vec2ToHexPosition(blockchainPosition);
        const direction = calculateDirection(currentHexPos, targetPos);

        if (!direction) {
            console.warn("Invalid move: positions are not adjacent");
            return;
        }

        console.log("Executing move:", { currentHexPos, targetPos, direction });

        // Execute blockchain move
        handleBlockchainMove(direction);
    }, [blockchainPosition, canMove, handleBlockchainMove, isSpawned]);

    // Show loading state while waiting for blockchain sync
    if (!isSpawned || !blockchainPosition) {
        return (
            <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0a0a1e 0%, #1a1a3e 50%, #0a0a1e 100%)" }}>
                <div style={{ textAlign: "center", color: "#e0e0e0" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Loading game state...</div>
                    <div style={{ fontSize: "0.9rem", color: "#aaa" }}>Syncing with blockchain</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Header />
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                {/* Position Display */}
                <div style={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    zIndex: 1000,
                    color: "#e0e0e0",
                    background: "rgba(10,10,30,0.8)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    pointerEvents: "auto",
                }}>
                    <div style={{ marginBottom: 4, fontWeight: 600, color: "#f5a623" }}>
                        Position: ({playerPosition.col}, {playerPosition.row})
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>
                        Can Move: {canMove ? "Yes" : "Wait..."}
                    </div>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleRefresh}
                        sx={{
                            fontSize: "0.7rem",
                            padding: "4px 8px",
                            minWidth: "auto",
                            borderColor: "rgba(66, 133, 244, 0.5)",
                            color: "#4285f4",
                            "&:hover": {
                                borderColor: "#4285f4",
                                backgroundColor: "rgba(66, 133, 244, 0.1)",
                            }
                        }}
                    >
                        Refresh State
                    </Button>
                </div>

                <HexGrid
                    width={20}
                    height={20}
                    playerPosition={playerPosition}
                    onMove={handleMove}
                />
            </div>
        </div>
    );
}
