import { useState, useCallback } from "react";
import { KeysClause, ToriiQueryBuilder } from "@dojoengine/sdk";

import { useAccount } from "@starknet-react/core";
import { useDojoSDK, useEntityId, useEntityQuery } from "@dojoengine/sdk/react";
import "./App.css";
import HexGrid from "./components/HexGrid";
import Header from "./components/Header";
import type { HexPosition } from "./three/utils";
import { ControllerProvider } from "./contexts/controller";

function App() {
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

    const [playerPosition, setPlayerPosition] = useState<HexPosition>({ col: 0, row: 0 });

    const handleMove = useCallback((pos: HexPosition) => {
        setPlayerPosition(pos);
    }, []);

    return (
        <ControllerProvider>
            <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <Header />
                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
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
                            Position: ({playerPosition.col}, {playerPosition.row})
                        </div>
                        <div style={{ color: client ? "#44cc44" : "#ff4444" }}>
                            {client ? "Connected" : "Disconnected"}
                        </div>
                    </div>
                    <HexGrid
                        width={20}
                        height={20}
                        playerPosition={playerPosition}
                        onMove={handleMove}
                    />
                </div>
            </div>
        </ControllerProvider>
    );
}

export default App;
