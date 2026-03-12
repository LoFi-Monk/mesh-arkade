import { appName, primaryTagline, taglines, colors } from "./branding";

export function DiscoveryDeck() {
  const tagline = taglines[Math.floor(Math.random() * taglines.length)];

  return (
    <div
      style={{
        backgroundColor: colors.primary.toLowerCase(),
        color: colors.accent.toLowerCase(),
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
          letterSpacing: "-0.02em",
        }}
      >
        {appName}
      </h1>
      <p
        style={{
          fontSize: "1.25rem",
          color: colors.secondary.toLowerCase(),
          marginBottom: "1.5rem",
        }}
      >
        {primaryTagline}
      </p>
      <p
        style={{
          fontSize: "1rem",
          fontStyle: "italic",
          opacity: 0.8,
        }}
      >
        "{tagline}"
      </p>
    </div>
  );
}
