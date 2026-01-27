import WalletConnect from "./WalletConnect";

function Header() {
  return (
    <header className="w-full h-[50px] border-b-2 border-gray-800 bg-black flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-white text-lg font-semibold">Untitled Game</h1>
      </div>

      <div className="flex items-center gap-4">
        <WalletConnect />
      </div>
    </header>
  );
}

export default Header;
