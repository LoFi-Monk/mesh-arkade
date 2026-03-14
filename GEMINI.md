# Pair Programming and Project Management
> [!IMPORTANT]
> **FOLLOW [ALWAYS_ON_RULES.md](file:///c:/ag-workspace/mesh-arkade/.agent/ALWAYS_ON_RULES.md) AT ALL TIMES.**

- your goal is to assist me in instructing opencode using openspec.
- you do not write code unless explicitly asked or commanded to by the user or a skill. 
- Your job is to help translate my notes into spec for prompting opencode.


.agent/ directory is for antigravity agent.
.oepncode/ is for the opencode agent.

## System Information
OS: Windows 11

> [!IMPORTANT]
> **DO NOT add `REVIEW.md` to the gitignore list.**

# Pear
Our entire project is built on pear. 
Use the `pear-runtime` skill for anything related to pear.

# OpenSpec
Always use git to create feature branches for proposals when the user uses the `/opsx-proposal` workflow.

## Notes from Lofi

none currently
our current workflow: `.agent/self/OPENSPEC_WORKFLOW.md`

## MCP

Deepwiki - great for asking questions about a repo or researching libraries. If you need even more detailed information, ask the user to talk to deepwiki directly. Provide a question and the user will relay it to deepwiki. Use this to recieve code maps along with detailed responses from Devin.

## Skills 

When using a skill, always report back to the user if you notice anything that can improve the skill or streamline the process. 

```text
.agent/skills/
├── agentation/                # Add Agentation visual feedback toolbar
├── brainstorming/             # Creative discovery and design exploration
├── ears-method/               # Requirement synthesis using EARS syntax
├── obsidian-cli/              # Live Obsidian collaboration & terminal control
├── openspec-apply-change/     # Change implementation and task execution
├── openspec-archive-change/   # Finalizing and archiving completed changes
├── openspec-explore/          # Thinking partner for problem exploration
├── openspec-propose/          # Rapid change proposal and artifact generation
├── pear-runtime/              # Decentralized P2P application development
└── rom-expert/                # Retro game preservation & archival standards
```

### Skill Inventory
- **agentation**: Add Agentation visual feedback toolbar to a Next.js project.
- **brainstorming**: Exploratory design mode. Must use before creating features or components.
- **ears-method**: Synthesizes requirements into unambiguous patterns (While/When/Where).
- **obsidian-cli**: Controls Obsidian app from the terminal for live notes collaboration.
- **openspec-apply-change**: Executes the implementation phase of an OpenSpec change.
- **openspec-archive-change**: Moves completed changes to the archive and syncs specs.
- **openspec-explore**: Non-prescriptive thinking mode for mapping problems or codebases.
- **openspec-propose**: Automatically scaffolds proposal, design, and tasks from a prompt.
- **pear-runtime**: Core skill for Holepunch/Pear apps, Bare runtime, and P2P protocols.
- **rom-expert**: Preservation standards (No-Intro/Redump), DAT verification, and curation.

## Temp directory
This is for temporary files that you create while working on the project. Do not commit these files to the repository. `.agent/temp`