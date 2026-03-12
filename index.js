import Runtime from "pear-electron";
import Bridge from "pear-bridge";

const isDev = Pear.app.dev;
const runtime = new Runtime();
// Note: runtime.ready() is reportedly not a function in this version
console.log("Pear Runtime initializing...");

let bridge;

if (isDev) {
  const devServerUrl = "http://localhost:5173";

  bridge = new Bridge({
    mount: "/",
  });
} else {
  bridge = new Bridge({
    mount: "/",
    directory: "./dist",
  });
}

await bridge.ready();

const pipe = runtime.start({
  bridge: isDev ? { ...bridge, addr: "http://localhost:5173" } : bridge,
});

Pear.teardown(() => {
  pipe.end();
});
