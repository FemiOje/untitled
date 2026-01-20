import { KeysClause, ToriiQueryBuilder } from "@dojoengine/sdk";

import { useAccount } from "@starknet-react/core";
import { useDojoSDK, useEntityId, useEntityQuery } from "@dojoengine/sdk/react";
import "./App.css";
import HexGrid from "./components/HexGrid";

function App() {
    const { useDojoStore, client } = useDojoSDK();
    const { account } = useAccount();
    const entities = useDojoStore((state) => state.entities);

    const entityId = useEntityId(account?.address ?? "0");

    useEntityQuery(
        new ToriiQueryBuilder()
            .withClause(
                // Querying Moves and Position models that has at least [account.address] as key
                KeysClause([], [undefined], "VariableLen").build()
            )
            .includeHashedKeys()
    );

    return (
        <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, color: "white", background: "rgba(0,0,0,0.5)", padding: "10px", borderRadius: "5px" }}>
                {/* <h1 style={{ margin: 0, fontSize: "18px" }}>Hexagonal Grid</h1> */}
                {client ? (
                    <p style={{ margin: "5px 0", fontSize: "12px" }}>✅ Dojo SDK initialized</p>
                ) : (
                    <p style={{ margin: "5px 0", fontSize: "12px" }}>❌ Dojo SDK failed</p>
                )}
            </div>
            <HexGrid width={10} height={10} />
        </div>
    );
}

export default App;
