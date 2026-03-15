import type { CommandOptions, MountEntry } from "./types.js";

/**
 * Writes arbitrary data to stdout, respecting the active output mode.
 *
 * @intent Provide a single output path so commands do not scatter `console.log` calls with ad-hoc JSON branching.
 * @guarantee When `options.isJson` is true the value is emitted as compact JSON; otherwise strings are printed as-is and objects are pretty-printed.
 */
export function output(data: unknown, options: CommandOptions): void {
  if (options.isJson) {
    console.log(JSON.stringify(data));
  } else if (typeof data === "string") {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Renders a list of mount entries as a formatted ASCII table or a JSON array.
 *
 * @intent Give the `list-mounts` command a consistent tabular display without embedding formatting logic inside the handler.
 * @guarantee Outputs a JSON array when `options.isJson` is true; otherwise prints a fixed-width ASCII table or a "No libraries mounted." message when the list is empty.
 */
export function table(rows: MountEntry[], options: CommandOptions): void {
  if (options.isJson) {
    console.log(JSON.stringify(rows));
    return;
  }

  if (rows.length === 0) {
    console.log("No libraries mounted.");
    return;
  }

  console.log("Mounted Libraries:");
  console.log("+----------------------------------+----------+--------+");
  console.log("| Path                             | Status   | Files  |");
  console.log("+----------------------------------+----------+--------+");
  for (const m of rows) {
    const path =
      m.path.length > 34 ? "..." + m.path.slice(-31) : m.path.padEnd(34);
    const status = m.status.padEnd(8);
    const files = String(m.fileCount).padEnd(6);
    console.log(`| ${path} | ${status} | ${files} |`);
  }
  console.log("+----------------------------------+----------+--------+");
}

/**
 * Emits an error message in the appropriate format for the current output mode.
 *
 * @intent Centralise error presentation so all command handlers produce consistent error output.
 * @guarantee When `options.isJson` is true the message is wrapped in `{ error: message }`; otherwise it is prefixed with "Error: ".
 */
export function error(message: string, options: CommandOptions): void {
  if (options.isJson) {
    console.log(JSON.stringify({ error: message }));
  } else {
    console.log(`Error: ${message}`);
  }
}

/**
 * Emits a success message in the appropriate format for the current output mode.
 *
 * @intent Centralise success presentation so all command handlers produce consistent confirmation output.
 * @guarantee When `options.isJson` is true the message is wrapped in `{ success: true, message }`; otherwise it is printed as plain text.
 */
export function success(message: string, options: CommandOptions): void {
  if (options.isJson) {
    console.log(JSON.stringify({ success: true, message }));
  } else {
    console.log(message);
  }
}
