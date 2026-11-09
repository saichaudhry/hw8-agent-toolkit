# HW8 Agent Toolkit: `submission-check` + `kalshi-lookup`

## What's in here

| Path | What it is |
|---|---|
| `skills/submission-check/SKILL.md` | Checker skill (report-only) |
| `mcp-server/server.js` | One-tool MCP server: `kalshi_lookup` |
| `smoke-test/toolkit-ping/SKILL.md` | Trivial skill used to prove skills were being loaded at all |
| `transcripts/` | Raw (`.jsonl`) and trimmed (`.md`) logs of every run; `summarize.py` makes the `.md` from the `.jsonl` |
| `DEMONSTRATION.md`, `ITERATION.md` | Evidence and the failure/fix story |

## The skill: `submission-check`

I use submission-check when I want to know whether a project is ready to turn in. I can type “is this ready to submit,” and it reads the assignment brief or SPEC, labels each requirement PRESENT, PARTIAL, MISSING, or CAN’T VERIFY, and points to evidence in the files. It also flags leftover TODOs and unfinished AI drafts, then gives a READY or NOT READY verdict. It only reports what it finds and never edits files.

## The MCP tool: `kalshi_lookup`

kalshi_lookup gives the agent live data from Kalshi’s public API without an API key or account access. Given a series, event, or market ticker, it returns prices in cents, volume, and close time; `raw: true` also includes the actual JSON fields for writing code. This lets the agent inspect current data and field names instead of relying on memory.

## Why I built these

I built these tools because the same problems kept showing up in my projects. I would get the main functionality working, but unfinished documentation could still make it into the submission. In Project 2, I asked:

> “is this ready to submit”

But `the-sharp/prompt_log.md:5` still contained:

> “TODO (your words): which tool for which job and why.”

That is the gap I want the checker to catch. Asking an agent whether something is ready is more useful when it follows a repeatable process, checks the actual requirements, and shows evidence for its answers.

Kalshi caused a different recurring problem. My HW3 log, `kalshi-nfl-board/prompt_log.md:104-105`, says:

> “Prices are strings in dollars, not integer cents. Code written from memory would have rendered an entire page of — without erroring.”

Kalshi came up again in HW4 and Project 2, where I typed (`the-sharp/prompt_log.md:67`):

> “use kalshi api, i hvae stored pull it”

so rediscovering its tickers and response fields was repeated work. The MCP tool adds new reach because it can fetch live information that instructions alone cannot provide. The checker gives the agent a more consistent review process; the MCP tool gives it access to current external data.

## Install

**Requirements:** Node 18+ (tested on Node 24.15). Python isn't needed. I used Node because the Python `mcp` package needs Python ≥3.10 and my Mac only has 3.9.

### 1. The skill

Copy (or symlink) the folder into your skills directory:

```bash
# Claude Code (personal skills, all projects)
cp -r skills/submission-check ~/.claude/skills/
# Codex: ~/.codex/skills/ (or ~/.agents/skills/, check the current Codex docs)
```

Check it loaded: open a new session and ask "what skills do you have?", or install `smoke-test/toolkit-ping` the same way and say "ping toolkit". The reply should start with `PONG-114`.

### 2. The MCP server

```bash
cd mcp-server
npm install
npm run smoke        # starts the server over stdio, lists tools, makes 3 sample calls
```

Register it. Replace `/ABSOLUTE/PATH/TO` with **your own machine's path** to this repo:

**Claude Code**
```bash
claude mcp add --scope user kalshi-lookup -- node /ABSOLUTE/PATH/TO/hw8-agent-toolkit/mcp-server/server.js
claude mcp get kalshi-lookup     # should say: Status: ✔ Connected
```
Or as JSON (`.mcp.json` in a project root):
```json
{ "mcpServers": { "kalshi-lookup": { "command": "node", "args": ["/ABSOLUTE/PATH/TO/hw8-agent-toolkit/mcp-server/server.js"] } } }
```

**Codex** (`~/.codex/config.toml`, use forward slashes; not tested, see below):
```toml
[mcp_servers.kalshi-lookup]
command = "node"
args = ["/ABSOLUTE/PATH/TO/hw8-agent-toolkit/mcp-server/server.js"]
```

## Where I confirmed it works

The recorded tests used Claude Code 2.1.319 on macOS. The checker was tested on Sonnet, and both Sonnet and Opus called the MCP tool successfully; these tests do not establish that the toolkit works in Codex.

## Borrowed / adapted

I adapted the report format and the rule requiring file-and-line evidence for every PRESENT item from the course’s spec-check example. The server structure follows the MCP TypeScript SDK quickstart using `McpServer` and `StdioServerTransport`; no third-party skills were installed.

## How I used AI

I used Claude Code to find evidence in my earlier logs, draft the skill and server from the options I selected, run separate worker and checker sessions, and create the documentation skeletons. I chose the submission checker, the Kalshi tool, and the line-tracker demo task. The development and testing transcripts are in `transcripts/`, including `run1-worker.md`, `rerun-skill-v2-p3-checker.md`, `run2-worker.md`, and `run2-checker.md`.
