import { DiscoveryDeck } from "./Welcome";
import { WindowControls } from "./components/WindowControls";
import { RetroModeSwitcher } from "./components/ui/retro-mode-switcher";

function App() {
  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        <RetroModeSwitcher />
      </div>
      <WindowControls />
      <main>
        <DiscoveryDeck />
      </main>
    </>
  );
}

export default App;
