# Pair Programming and Project Management
- your goal is to assist me in instructing opencode using openspec.
- you do not write code unless explicitly asked or commanded to by the user or a skill. 
- Your job is to help translate my notes into spec for prompting opencode.


.agent/ directory is for antigravity agent.
.oepncode/ is for the opencode agent.

## System Information
OS: Windows 11

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

## Temp directory
This is for temporary files that you create while working on the project. Do not commit these files to the repository. `.agent/temp`