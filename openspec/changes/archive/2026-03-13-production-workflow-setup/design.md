# Design: Production Contribution Workflow

This design defines the technical implementation of the automated quality gates and collaborative workflow.

## 1. CI Pipeline (GitHub Actions)
Create `.github/workflows/ci.yml` that executes on every pull request to `main` and every push to `main`.

### Pipeline Jobs:
- **Build**: Ensure the project compiles/builds.
- **Lint & Style**: 
    - Run Prettier check.
    - **Comment Validation**: Run `scripts/check-tsdoc.mjs` with a `--strict` flag to fail if any exported member lacks the required TSDoc blocks.
- **Type Check**: Run `tsc --noEmit`.
- **Test**: Run all unit and integration tests via `npm test` with coverage reporting.

## 2. Branch Protection (GitHub Setting)
The `main` branch will be protected with the following requirements:
- **Require a Pull Request before merging**: No direct pushes from anyone, including owners.
- **Require status checks to pass**: The CI pipeline defined above MUST be successful.
- **Require conversation resolution**: All review comments must be marked as resolved.
- **Require linear history**: Prevent merge commits to keep the history clean.

## 3. Collaborative Assets
- **PR Template**: `.github/pull_request_template.md` to force contributors to link to the relevant OpenSpec change and summarize their work.
- **CODEOWNERS**: `.github/CODEOWNERS` to auto-request reviews from the user (and AI agents if configured via GitHub Apps).

## 4. Risks / Trade-offs
- **CI Cost**: GitHub Actions use minutes. We mitigate this by keeping the script lean.
- **Agent Interoperability**: Some AI agents might struggle with "resolved conversations" if they aren't configured to use the GitHub Comments API correctly. We will provide instructions for Opencode.
