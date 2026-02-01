import { useCallback } from "react";
import { KeysClause, ToriiQueryBuilder } from "@dojoengine/sdk";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK, useEntityId, useEntityQuery } from "@dojoengine/sdk/react";
import "./App.css";
import HexGrid from "./components/HexGrid";
import Header from "./components/Header";
import type { HexPosition } from "./three/utils";
import { ControllerProvider } from "./contexts/controller";
import { GameDirectorProvider } from "./contexts/GameDirector";
import { useCurrentPosition, useIsSpawned, useCanPlayerMove } from "./stores/gameStore";
import { useGameActions } from "./dojo/useGameActions";
import { vec2ToHexPosition, calculateDirection } from "./utils/coordinateMapping";
import { useController } from "./contexts/controller";

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#2196f3',
        },
        secondary: {
            main: '#4caf50',
        },
    },
});

function AppContent() {
    const { useDojoStore, client } = useDojoSDK();
    const { account } = useAccount();
    const entities = useDojoStore((state) => state.entities);

    const entityId = useEntityId(account?.address ?? "0");

    useEntityQuery(
        new ToriiQueryBuilder()
            .withClause(
                KeysClause([], [undefined], "VariableLen").build()
            )
            .includeHashedKeys()
    );

    // Get wallet address for debugging
    const { address: walletAddress, account: controllerAccount } = useController();

    // Get blockchain state
    const blockchainPosition = useCurrentPosition();
    const isSpawned = useIsSpawned();
    const canMove = useCanPlayerMove();
    const { handleSpawn, handleMove: handleBlockchainMove, isLoading } = useGameActions();

    // Convert blockchain Vec2 to HexPosition for display
    const playerPosition: HexPosition = blockchainPosition
        ? vec2ToHexPosition(blockchainPosition)
        : { col: 0, row: 0 };

    // Debug spawn button
    const handleSpawnClick = useCallback(async () => {
        console.log("🎮 Spawn button clicked!");
        console.log("Wallet address (from App):", walletAddress);
        console.log("Account object:", controllerAccount);
        console.log("isSpawned:", isSpawned);
        console.log("isLoading:", isLoading);
        console.log("handleSpawn function:", handleSpawn);
        console.log("Calling handleSpawn...");
        try {
            await handleSpawn();
            console.log("✅ handleSpawn completed");
        } catch (error) {
            console.error("❌ handleSpawn error:", error);
        }
    }, [handleSpawn, isSpawned, isLoading, walletAddress, controllerAccount]);

    // Handle move from HexGrid
    const handleMove = useCallback((targetPos: HexPosition) => {
        if (!blockchainPosition || !canMove) {
            console.warn("Cannot move: player not spawned or cannot move yet");
            return;
        }

        // Calculate direction from current position to target
        const currentHexPos = vec2ToHexPosition(blockchainPosition);
        const direction = calculateDirection(currentHexPos, targetPos);

        if (!direction) {
            console.warn("Invalid move: positions are not adjacent");
            return;
        }

        // Execute blockchain move
        handleBlockchainMove(direction);
    }, [blockchainPosition, canMove, handleBlockchainMove]);

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
                            pointerEvents: "none",
                        }}>
                            <div style={{ marginBottom: 4, fontWeight: 600, color: "#f5a623" }}>
                                {isSpawned ? (
                                    <>Position: ({playerPosition.col}, {playerPosition.row})</>
                                ) : (
                                    <>Not Spawned</>
                                )}
                            </div>
                            {isSpawned && (
                                <div style={{ fontSize: 11, color: "#aaa" }}>
                                    Can Move: {canMove ? "Yes" : "Wait..."}
                                </div>
                            )}
                        </div>

                        {/* Spawn Button Overlay */}
                        {!isSpawned && (
                            <div style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 1000,
                                pointerEvents: "auto",
                            }}>
                                <button
                                    onClick={handleSpawnClick}
                                    disabled={isLoading}
                                    style={{
                                        background: "#44cc44",
                                        color: "#0a0a1e",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "16px 32px",
                                        fontFamily: "monospace",
                                        fontSize: 16,
                                        fontWeight: 700,
                                        cursor: isLoading ? "not-allowed" : "pointer",
                                        opacity: isLoading ? 0.6 : 1,
                                        boxShadow: "0 4px 16px rgba(68, 204, 68, 0.3)",
                                        pointerEvents: "auto",
                                    }}
                                >
                                    {isLoading ? "Spawning..." : "Spawn Player"}
                                </button>
                            </div>
                        )}

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

function App() {
    return (
        <ThemeProvider theme={theme}>
            <ControllerProvider>
                <GameDirectorProvider>
                    <AppContent />
                </GameDirectorProvider>
            </ControllerProvider>
        </ThemeProvider>
    );
}

export default App;
