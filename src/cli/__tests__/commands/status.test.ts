import { describe, it, expect, vi } from "vitest";
import { handleStatus, showStatus } from "../../commands/status.js";

describe("handleStatus", () => {
  it("should output status in JSON mode", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleStatus("", {} as any, { isJson: true, isSilent: false });
    expect(consoleLog).toHaveBeenCalled();
    const output = JSON.parse(consoleLog.mock.calls[0][0] as string);
    expect(output.status).toBe("ready");
    expect(output.version).toBe("0.1.0");
    consoleLog.mockRestore();
  });

  it("should output status in human mode", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleStatus("", {} as any, { isJson: false, isSilent: false });
    const output = consoleLog.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Status:");
    expect(output).toContain("Mode:");
    consoleLog.mockRestore();
  });
});

describe("showStatus", () => {
  it("should show status object", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    showStatus({ isJson: false, isSilent: false }, "bare");
    const output = consoleLog.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("bare");
    consoleLog.mockRestore();
  });
});
