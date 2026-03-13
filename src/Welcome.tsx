import { appName, descriptor, taglines } from "./core/branding";
import { Card, CardContent } from "./components/ui/8bit/card";

export function DiscoveryDeck() {
  const currentTagline = taglines[Math.floor(Math.random() * taglines.length)];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 font-retro">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-retro-primary animate-pulse">
            {appName}
          </h1>
          
          <div className="space-y-2">
            <p className="text-xl md:text-2xl text-retro-secondary opacity-90 leading-relaxed">
              {descriptor}
            </p>
            <p className="text-sm md:text-base text-muted-foreground uppercase tracking-widest">
              {currentTagline}
            </p>
          </div>

          <div className="pt-4 border-t-4 border-retro-secondary/20">
            <p className="text-xs text-retro-secondary/60">
              System Ready. Initializing P2P Mesh...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
