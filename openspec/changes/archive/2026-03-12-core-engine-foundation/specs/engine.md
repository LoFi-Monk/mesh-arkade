# Spec: Terminal UX & Splash

## Visual Identity
The terminal experience is a "lean-and-mean" CLI tool.

### 1. ASCII Header
- **Art**: A simple 1-color ASCII "MESHARKADE" title.
- **Dynamic Content**: A single line randomized tagline (stdout).

### 2. Standard Output & Agent UX
- **Stream**: All system info and logs are written to standard output.
- **Structured Data**: Every command must support a `--json` alias for easy parsing by agents.
- **Silent Mode**: Provide a `--silent` flag to suppress the ASCII header and taglines.
- **No-Interactivity**: Commands must never block for input unless an `--interactive` flag is explicitly passed.

### 3. Command Syntax (Draft)
- `pear run --bare .`: Boots the engine and prints the splash/status.
- `pear run --bare . -- help`: Standard help text.
