import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiscoveryDeck } from "../src/Welcome";
import { appName, primaryTagline } from "../src/branding";

describe("DiscoveryDeck", () => {
  it("renders the app name", () => {
    render(<DiscoveryDeck />);
    expect(screen.getByText(appName)).toBeInTheDocument();
  });

  it("renders the primary tagline", () => {
    render(<DiscoveryDeck />);
    expect(screen.getByText(primaryTagline)).toBeInTheDocument();
  });

  it("renders a random tagline from the list", () => {
    render(<DiscoveryDeck />);
    const taglineElements = screen.getAllByText(/"[^"]+"/);
    expect(taglineElements.length).toBeGreaterThan(0);
  });
});
