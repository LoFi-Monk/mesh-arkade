import { describe, it, expect, vi } from "vitest";
import { handleHelp, showHelp } from "../../commands/help.js";

describe("handleHelp", () => {
  it("should call showHelp", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleHelp("", {} as any, { isJson: false, isSilent: false });
    const output = consoleLog.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Usage:");
    expect(output).toContain("Commands:");
    consoleLog.mockRestore();
  });

  it("should output JSON in JSON mode", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleHelp("", {} as any, { isJson: true, isSilent: false });
    const output = JSON.parse(consoleLog.mock.calls[0][0] as string);
    expect(output.commands).toBeDefined();
    expect(output.commands.help).toBeDefined();
    consoleLog.mockRestore();
  });
});

describe("showHelp", () => {
  it("should show help text", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    showHelp({ isJson: false, isSilent: false });
    const output = consoleLog.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("mesh-arkade");
    expect(output).toContain("mount");
    expect(output).toContain("unmount");
    consoleLog.mockRestore();
  });
});
