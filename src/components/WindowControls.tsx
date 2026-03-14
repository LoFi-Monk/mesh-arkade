import React from "react";
import { X, Minus, Square } from "lucide-react";
import { Button } from "./ui/8bit/button";

/**
 * Custom window control buttons (Minimize, Maximize, Close) for Pear/Electron.
 *
 * @intent Provide OS-native feeling window management in the customized title bar.
 * @guarantee Safely invokes Pear UI APIs if available, otherwise renders null.
 */
export function WindowControls() {
  // Access Pear API from the window object (provided by pear-electron)
  const pear = (window as any).Pear;

  const handleMinimize = () => {
    pear?.ui?.app?.minimize();
  };

  const handleMaximize = () => {
    // Note: Pear often uses toggleMaximize or maximize/restore
    const app = pear?.ui?.app;
    if (app) {
      // Basic implementation - check if we can maximize
      app.maximize();
    }
  };

  const handleClose = () => {
    pear?.ui?.app?.close();
  };

  if (!pear) {
    // Hide controls if not running in Pear runtime (e.g. browser dev)
    if (import.meta.env.DEV) {
      console.log("Pear API not found - window controls hidden");
    }
    return null;
  }

  return (
    <div className="fixed top-0 right-0 p-2 flex gap-1 z-50 no-drag">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMinimize}
        className="h-8 w-8 hover:bg-retro-secondary/20 text-retro-secondary border-retro-secondary border-2"
        title="Minimize"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMaximize}
        className="h-8 w-8 hover:bg-retro-secondary/20 text-retro-secondary border-retro-secondary border-2"
        title="Maximize"
      >
        <Square className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="h-8 w-8 hover:bg-retro-primary/20 text-retro-primary border-retro-primary border-2"
        title="Close"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
