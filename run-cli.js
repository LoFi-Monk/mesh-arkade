
import { createInterface } from 'readline';

// Mock Pear Runtime for local CLI demonstration
globalThis.Pear = {
  app: {
    args: process.argv.slice(2),
    key: null,
    dev: true,
    storage: "./data-demo"
  },
  teardown: (fn) => {
    process.on('SIGINT', async () => {
      await fn();
      process.exit();
    });
  }
};

// Mock modules that are part of the Pear/Electron bridge but not used in --bare mode
// We need to handle the dual imports in index.js
const mockModule = { default: class { start() { return { end: () => {} } } ready() {} close() {} } };

// Note: In a real Pear app, these are provided by the runtime.
// For the demo, we just want to get past the imports.

console.log("--- MESHARKADE CLI DEMO ---");
await import('./index.js');
