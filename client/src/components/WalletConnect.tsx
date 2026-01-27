import { useController } from "../contexts/controller";
import { useAccount } from "@starknet-react/core";
import { Gamepad2 } from "lucide-react";

const ellipseAddress = (address: string, start = 4, end = 4): string => {
  if (!address) return "";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

function WalletConnect() {
  const { isPending, playerName, login, openProfile } = useController();
  const { account, address } = useAccount();

  return (
    <>
      {account && address ? (
        <button
          onClick={() => openProfile()}
          disabled={!playerName}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
        >
          <Gamepad2 size={16} />
          {playerName ? playerName : ellipseAddress(address, 4, 4)}
        </button>
      ) : (
        <button
          onClick={() => login()}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
        >
          <Gamepad2 size={16} />
          {isPending ? "Connecting..." : "Log In"}
        </button>
      )}
    </>
  );
}

export default WalletConnect;
