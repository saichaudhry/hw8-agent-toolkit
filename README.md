# HW8 Agent Toolkit: `submission-check` + `kalshi-lookup`

> ⚠️ **TODO (your words): this whole README must be written by Sai, not AI (HW8 "What to Submit").**
> Everything under a "FACTS" block is raw material Claude verified. Rewrite it in your own words and delete the FACTS blocks.
> The install commands are fine to keep as-is.

## What's in here

| Path | What it is |
|---|---|
| `skills/submission-check/SKILL.md` | Checker skill (report-only) |
| `mcp-server/server.js` | One-tool MCP server: `kalshi_lookup` |
| `smoke-test/toolkit-ping/SKILL.md` | Trivial skill used to prove skills were being loaded at all |
| `transcripts/` | Raw (`.jsonl`) and trimmed (`.md`) logs of every run; `summarize.py` makes the `.md` from the `.jsonl` |
| `DEMONSTRATION.md`, `ITERATION.md` | Evidence and the failure/fix story |

## The skill: `submission-check`

> TODO (your words): what it does and when it triggers.

FACTS (delete after rewriting):
- Reads the brief (user-named file → `ASSIGNMENT.md` → `SPEC.md` → any root .md with a Deliverables/Requirements/Acceptance criteria heading), labels each deliverable PRESENT / PARTIAL / MISSING / CAN'T VERIFY with file:line evidence, lists leftover placeholders (`TODO`, `your words`, `Edit it into your own voice`...), a DO YOURSELF checklist for off-repo items, and a READY / NOT READY verdict.
- Never edits files, never prints secret values, never opens `.env*`.
- Triggered on its own (no slash command) in a fresh Sonnet session from the plain prompt "is this ready to submit".

## The MCP tool: `kalshi_lookup`

> TODO (your words): what it does.

FACTS:
- Read-only lookup against Kalshi's **public** API (no key, GET only, no account access).
- Takes any ticker level: series `KXNFLGAME`, event `KXNFLGAME-26NOV16LACBAL`, or market `KXNFLGAME-26NOV16LACBAL-LAC`. Optional `contains` (team code, city, or nickname like "Bills"), `status` (open/any), `limit`, `raw` (also return the raw JSON field names, for writing code).
- Returns YES bid/ask/last converted to cents, volume, open interest, status, close time, grouped by event.

## Why I built these (evidence from my prompt logs)

> TODO (your words): the friction, plus 2–3 quoted lines.

FACTS (quotes are verbatim from your logs):
- Checker:
  - `~/.claude/projects` session 23adc771, 2026-10-07 (Project 2): you pasted the brief with *"is this ready to submit"*. `the-sharp/prompt_log.md:5` still says *"TODO (your words): which tool for which job and why."*
  - `kalshi-nfl-board/prompt_log.md:5` (HW3): *"Note: this is a draft record produced at the end of the session. Edit it into your own voice"* is still in the file.
  - `the-sharp-classic/README.md` and `prompt_log.md` still have the same TODO markers.
  - `hw6-122-tutor/prompt_log.md:68`: *"what is read me sections 1-4 list it here , and how i used ai paragaph"*
  - `pocket-shuffle-pool-phase2/prompt_log.md:10` (HW7): *"maek sure to do the whole repo clone thing it isntructs on the assignement doc"*
- MCP:
  - `kalshi-nfl-board/prompt_log.md:104` (HW3): *"Prices are strings in dollars, not integer cents. Code written from memory would have rendered an entire page of `—` without erroring."*
  - Kalshi came back in HW3, HW4 (gridiron-ask-backend), and Project 2 (`the-sharp`: *"use kalshi api, i hvae stored pull it"*), and every time the agent had to rediscover tickers and fields.

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

**Codex** (`~/.codex/config.toml`, use forward slashes):
```toml
[mcp_servers.kalshi-lookup]
command = "node"
args = ["/ABSOLUTE/PATH/TO/hw8-agent-toolkit/mcp-server/server.js"]
```

## Where I confirmed it works

> TODO (your words)

FACTS: Claude Code CLI 2.1.319 on macOS. `submission-check` was exercised only on Sonnet 5.5 (all 6 checker sessions); skill loading in general was confirmed on Opus 5.5 too, via the toolkit-ping smoke test (`transcripts/00-smoke-test.txt`); MCP tool confirmed called by Sonnet 5.5 and Opus 5.5 (`transcripts/01-mcp-call-check.md`, `transcripts/rerun-mcp-v2-worker.md`). **Codex was NOT tested** (it isn't installed on this machine). Only list Codex if you test it yourself.

## Borrowed / adapted

> TODO (your words)

FACTS: The output-format line and the "cite a file and line for every PRESENT" rule are adapted from the HW8 page's `spec-check` example. The server structure follows the MCP TypeScript SDK `McpServer` + `StdioServerTransport` quickstart. No third-party skills were installed.

## How I used AI

> TODO (your words), with citations.

FACTS: Claude Code (Opus 5.5) in one terminal session: mined your prompt logs and old sessions for evidence, recovered the HW6/HW7/Project 2 briefs from session history, wrote the skill/server drafts from your choices (you picked submission-check + Kalshi from evidence-backed options), ran every worker/checker run as a separate headless `claude -p` process (worker = Opus, checker = Sonnet), and wrote these skeletons. It did not write the README/DEMONSTRATION/ITERATION prose.
