# AGENTS.md - Agent Guidelines for mesh-arkade

## Project Overview

This is mesh-arkade, a project in the `C:\ag-workspace\mesh-arkade` directory. When code is added, analyze existing patterns before making changes.

## Build, Lint, and Test Commands

### Running the Project

```bash
# Install dependencies (check package.json or requirements.txt for tool)
npm install    # Node/TypeScript
pip install -r requirements.txt  # Python
cargo build    # Rust
go build       # Go

# Run the project
npm start      # Node/TypeScript
python main.py # Python
cargo run      # Rust
go run .       # Go
```

### Running Tests

```bash
# Run all tests
npm test       # Node/TypeScript (often uses Jest, Vitest, or Mocha)
pytest         # Python
cargo test     # Rust
go test ./...  # Go

# Run a single test
npm test -- --testNamePattern="specific test name"  # Jest
pytest -k "specific_test_name"                      # Python
cargo test specific_test_name                       # Rust
go test -run "TestSpecificName"                      # Go

# Run tests in watch mode
npm test -- --watch  # Jest
pytest -w           # Python (if pytest-watch installed)
cargo test --watch  # Rust
```

### Linting and Formatting

```bash
# Lint
npm run lint        # Node/TypeScript (ESLint)
pylint .            # Python
cargo clippy         # Rust
golangci-lint run   # Go

# Format code
npm run format      # Prettier
black .             # Python
cargo fmt           # Rust
gofmt -w .          # Go

# Type checking
npm run typecheck   # TypeScript
mypy .              # Python
cargo check         # Rust
go vet ./...        # Go
```

## Code Style Guidelines

### General Principles

- Write clean, readable code over clever code
- Keep functions small and focused (single responsibility)
- Use meaningful variable and function names
- Comment the "why", not the "what"
- Avoid premature optimization

### Imports and Dependencies

- Use absolute imports over relative when possible
- Group imports: stdlib, third-party, local
- Prefer explicit imports over wildcard (`from x import *`)
- Keep dependencies minimal - avoid pulling in libraries unnecessarily

### Formatting

- Use 2 or 4 spaces for indentation (match existing project)
- Max line length: 80-120 characters
- Add trailing commas where supported
- Use consistent quote style (single vs double)

### Types

- Use explicit types for function parameters and return values
- Avoid `any` type - use proper generics or union types
- Enable strict type checking
- Prefer interfaces over types for object shapes

### Naming Conventions

- `camelCase` - variables, functions, methods
- `PascalCase` - classes, components, types, interfaces
- `SCREAMING_SNAKE_CASE` - constants, env variables
- `kebab-case` - file names, URLs
- Use descriptive names: `calculateTotalPrice()` not `calc()`

### Error Handling

- Use typed errors, not generic exceptions where possible
- Don't silently swallow errors - log or re-raise appropriately
- Handle errors at the appropriate level
- Prefer Result/Either types over exceptions when idiomatic

### Git Conventions

- Use meaningful commit messages: "Add user authentication" not "fix"
- Keep commits atomic and focused
- Create feature branches for new work
- Run lint/typecheck before committing

### Testing Guidelines

- Write tests for new features and bug fixes
- Use descriptive test names: `test_returns_empty_list_when_no_items`
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies
- Aim for meaningful test coverage, not just high percentage

## Common Patterns

### File Organization

```
src/
  components/     # UI components
  services/       # Business logic, API clients
  utils/          # Helper functions
  types/          # TypeScript types/interfaces
  models/         # Data models
  __tests__/      # Test files (co-located or separate)
```

### Configuration

- Store secrets in environment variables, never in code
- Use config files for environment-specific settings
- Include `.env.example` for required variables

### Logging

- Use appropriate log levels: DEBUG, INFO, WARN, ERROR
- Don't log sensitive data (passwords, tokens, PII)
- Include context in log messages

## Running Full CI Checks

Before submitting changes:

```bash
# Full lint + typecheck + test
npm run lint && npm run typecheck && npm test  # Node
pylint . && mypy . && pytest                    # Python
cargo clippy && cargo test                      # Rust
golangci-lint run && go test ./...             # Go
```

---

When in doubt, follow the existing code style in the project. Consistency is more important than personal preference.
