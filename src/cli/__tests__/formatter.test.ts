import { describe, it, expect, vi } from "vitest";
import { output, table, error, success } from "../formatter.js";

describe("formatter", () => {
  describe("output", () => {
    it("should output JSON when isJson is true", () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      output({ foo: "bar" }, { isJson: true, isSilent: false });
      expect(consoleLog).toHaveBeenCalledWith('{"foo":"bar"}');
      consoleLog.mockRestore();
    });

    it("should output string directly when not JSON", () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      output("hello world", { isJson: false, isSilent: false });
      expect(consoleLog).toHaveBeenCalledWith("hello world");
      consoleLog.mockRestore();
    });

    it("should pretty print objects in human mode", () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      output({ foo: "bar" }, { isJson: false, isSilent: false });
      expect(consoleLog).toHaveBeenCalledWith('{\n  "foo": "bar"\n}');
      consoleLog.mockRestore();
    });
  });

  describe("table", () => {
    it("should output JSON array when isJson is true", () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      const rows = [{ path: "/test", status: "active", fileCount: 10 }];
      table(rows, { isJson: true, isSilent: false });
      expect(consoleLog).toHaveBeenCalledWith(JSON.stringify(rows));
      consoleLog.mockRestore();
    });

    it("should output empty message when no rows", () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      table([], { isJson: false, isSilent: false });
      expect(consoleLog).toHaveBeenCalledWith("No libraries mounted.");
      consoleLog.mockRestore();
    });

    it("should render table in human mode", () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      const rows = [{ path: "/test/library", status: "active", fileCount: 10 }];
      table(rows, { isJson: false, isSilent: false });
      expect(consoleLog).toHaveBeenCalled();
      const output = consoleLog.mock.calls.map((c) => c[0]).join("\n");
      expect(output).toContain("Path");
      expect(output).toContain("Status");
      expect(output).toContain("Files");
      consoleLog.mockRestore();
    });
  });

  describe("error", () => {
    it("should output JSON error object when isJson is true", () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      error("Something went wrong", { isJson: true, isSilent: false });
      expect(consoleLog).toHaveBeenCalledWith(
        '{"error":"Something went wrong"}',
      );
      consoleLog.mockRestore();
    });

    it("should output error message when not JSON", () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      error("Something went wrong", { isJson: false, isSilent: false });
      expect(consoleLog).toHaveBeenCalledWith("Error: Something went wrong");
      consoleLog.mockRestore();
    });
  });

  describe("success", () => {
    it("should output JSON success object when isJson is true", () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      success("Operation completed", { isJson: true, isSilent: false });
      expect(consoleLog).toHaveBeenCalledWith(
        '{"success":true,"message":"Operation completed"}',
      );
      consoleLog.mockRestore();
    });

    it("should output message when not JSON", () => {
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      success("Operation completed", { isJson: false, isSilent: false });
      expect(consoleLog).toHaveBeenCalledWith("Operation completed");
      consoleLog.mockRestore();
    });
  });
});
