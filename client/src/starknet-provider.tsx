import type { PropsWithChildren } from "react";
import { mainnet } from "@starknet-react/chains";
import { jsonRpcProvider, StarknetConfig, voyager } from "@starknet-react/core";
import { dojoConfig } from "../dojoConfig";
import { usePredeployedAccounts } from "@dojoengine/predeployed-connector/react";

// For local Katana development, we use predeployed accounts only
// To enable Cartridge Controller for production, set VITE_USE_CONTROLLER=true
const USE_CONTROLLER = import.meta.env.VITE_USE_CONTROLLER === "true";

export default function StarknetProvider({ children }: PropsWithChildren) {
    const { connectors: predeployedConnectors } = usePredeployedAccounts({
        rpc: dojoConfig.rpcUrl as string,
        id: "katana",
        name: "Katana",
    });

    const provider = jsonRpcProvider({
        rpc: () => ({ nodeUrl: dojoConfig.rpcUrl as string }),
    });

    return (
        <StarknetConfig
            chains={[mainnet]}
            provider={provider}
            connectors={predeployedConnectors}
            explorer={voyager}
            autoConnect
        >
            {/* @ts-ignore react version mismatch */}
            {children}
        </StarknetConfig>
    );
}
