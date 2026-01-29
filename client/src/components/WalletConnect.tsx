import { useController } from "../contexts/controller";
import { useAccount } from "@starknet-react/core";
import { Button } from "@mui/material";
import { Swords } from "lucide-react";

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
        <Button
          onClick={() => openProfile()}
          disabled={!playerName}
          variant="contained"
          color="primary"
          size="small"
          startIcon={<Swords size={16} />}
          sx={{ minWidth: '100px' }}
        >
          {playerName ? playerName : ellipseAddress(address, 4, 4)}
        </Button>
      ) : (
        <Button
          onClick={() => login()}
          disabled={isPending}
          variant="contained"
          color="secondary"
          size="small"
          startIcon={<Swords size={16} />}
          sx={{ minWidth: '100px' }}
        >
          {isPending ? "Connecting..." : "Log In"}
        </Button>
      )}
    </>
  );
}

export default WalletConnect;
