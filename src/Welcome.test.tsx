import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiscoveryDeck } from "./Welcome";
import { appName } from "./lib/branding";

describe("DiscoveryDeck", () => {
  it("renders the app name", () => {
    render(<DiscoveryDeck />);
    expect(screen.getByText(appName)).toBeInTheDocument();
  });

  it("renders a randomized descriptor", () => {
    render(<DiscoveryDeck />);
    // Replaces the old static primaryTagline test
    expect(screen.getByText(/A Decent Game .+/)).toBeInTheDocument();
  });
});
