# ITERATION: what broke and how I fixed it

> ⚠️ **TODO (your words): the assignment says this file must be written by Sai.** Below are the verified facts and
> where to find the evidence. Pick the failure(s) you want to tell, write the story yourself, and delete the FACTS blocks.
> The diffs are in git: `git show 6b14b05:skills/submission-check/SKILL.md` (v1) vs the current file (v2); same for `mcp-server/server.js`.

## Failure 1 (skill): v1 was too rigid and refused to run

> TODO (your words): what went wrong, your diagnosis, what you changed, and the rerun result.

FACTS:
- **What happened:** Fresh Sonnet session in `~/p3-line-tracker`, prompt "is this ready to submit". The skill **did trigger on its own** (`TOOL Skill: submission-check`), but then it stopped and produced no report:
  > "I can't run the check yet because there's no assignment brief. The repo has no `ASSIGNMENT.md`. The only markdown file is `SPEC.md`, which looks like your own project notes … I won't guess what's required."
  (`transcripts/run1-checker.md`)
- **Why:** v1 said "`ASSIGNMENT.md` in the repo root, or a file/URL the user names. If there is no brief, stop and ask." My own projects use `SPEC.md` (HW7 and the course's spec-check example), so the anti-guessing rule I added on purpose made the skill useless on my real repos.
- **Change (v2):** a lookup order (user-named → `ASSIGNMENT.md` → `SPEC.md` → any root .md with a Deliverables/Requirements/Acceptance criteria heading), the header has to name the file it used, and it only stops if none exist.
- **Rerun:** same prompt, same repo state, fresh Sonnet session → full report: `SUBMISSION CHECK: p3-line-tracker vs SPEC.md`, 9 labeled lines, and it caught `SPEC.md:3 "Drafted with Claude…"` as a placeholder (`transcripts/rerun-skill-v2-p3-checker.md`).

## Failure 2 (skill): marked things it can't see as MISSING, and printed a live API key

> TODO (your words)

FACTS (v1 on real past work: `~/the-sharp` vs the Project 2 brief recovered from session history; `transcripts/v1-thesharp-checker.md`):
- Marked "Google form response", "Midpoint check-in", and "Link from the portfolio" as **MISSING**, even though it admitted "This isn't something the repo can show", and then used them in the NOT READY verdict.
- Marked "Phone support" PRESENT with `README.md:15` as the evidence, which is just the README *claiming* it.
- **Security:** its secret scan grepped the untracked `.env.local` and **printed the full Anthropic API key and Vercel OIDC token into its output**. (Redacted in the committed transcript; it was never pushed.) The report itself said "the untracked `.env.local` does hold a live Anthropic key…".
- **Change (v2):** a new `CAN'T VERIFY` label (never MISSING) plus a "DO YOURSELF" checklist; the verdict is based only on PARTIAL/MISSING/placeholders; "a README sentence claiming it works is not evidence"; "Never print a secret's value. Do not open `.env*` files."
- **Rerun** (`transcripts/rerun-skill-v2-thesharp-checker.md`): off-repo items are now CAN'T VERIFY with a 6-item checklist; phone support is cited from `src/styles.css:672-698`; the key grep piped through `sed … [redacted]`, and no key appears anywhere in the transcript. Verdict NOT READY for the right reasons: `README.md:5 "Demo: TODO"` and the prompt_log TODOs.

## Failure 3 (MCP tool): the agent never called it during real coding

> TODO (your words)

FACTS:
- **Q&A worked:** asked "What does Kalshi currently have the Bills at…", Sonnet called `kalshi_lookup` 3× (`transcripts/01-mcp-call-check.md`). But its **first call was `contains: "BAL"`** (Baltimore, not Buffalo). It only corrected itself on the next call.
- **Coding didn't:** Run 1 worker (Opus, `~/p3-line-tracker`, "build snapshot.py from SPEC.md…") made **0 calls** to `kalshi_lookup`, even though the server was `connected`. It tried `curl` (blocked) and then hand-wrote `urllib` probes of the raw API (`transcripts/run1-worker.md`).
- **Diagnosis:** v1's description sold the tool as "look up live prices / odds", which suits a question, not "I'm about to write code". And its output hid the raw field names (`yes_bid_dollars`…), which are exactly what someone writing code needs, so the tool really was less useful than raw curl for coding. Kalshi titles use city names, so "Bills" matched nothing, and the agent guessed a code.
- **Change (v2):** description now starts with "Call this BEFORE writing or debugging any code that talks to Kalshi, instead of curl/urllib or guessing"; a new `raw: true` option returns the real JSON field names/format plus the endpoint to call; nicknames → team codes (`Bills` → BUF).
- **Rerun of v2 was itself a failure (two of them):**
  - My first rerun was invalid: `git clone` brought along Run 1's `snapshot-py` branch, so the agent merged the old `snapshot.py` instead of writing one (kept as `transcripts/rerun-mcp-v2-INVALID-clone-had-old-branch.md`). Re-done on a `--single-branch` clone with no remote.
  - Clean v2 rerun (`transcripts/rerun-mcp-v2-clean-worker.md`): it **still went to `curl` first** (3 attempts, all blocked by permissions) and only then searched for and used `kalshi_lookup` (4 calls, `raw: true`). So the better description helped once the agent looked, but it didn't make the agent look.
- **Real diagnosis:** the session's init event lists the tool next to `ToolSearch`. Claude Code **defers MCP tools**: the model sees only the name `mcp__kalshi-lookup__kalshi_lookup` until it runs ToolSearch, so **my description never reached the model when it decided how to start**. Rewriting the docstring couldn't fix discovery.
- **Change (v3):** added server-level `instructions` to the `McpServer` constructor ("Whenever a task involves Kalshi … call kalshi_lookup before using curl, urllib, or memory"). Claude Code always puts server instructions in the system prompt.
- **Rerun of v3** (`transcripts/rerun-mcp-v3-worker.md`), same prompt, clean clone, fresh Opus: after `ls`/`cat SPEC.md`, its **first action was ToolSearch → `kalshi_lookup`**, with 3 calls (`KXNFLGAME`/`KXNFLSPREAD`/`KXNFLTOTAL`, `contains: "BUF"`, `raw: true`), before any curl or urllib.
- **But it still went back to the raw API afterward:** 1 blocked curl, then several `urllib` probes. It said why: "I'm checking which team codes Kalshi uses before I write snapshot.py." It wanted the full list of all 32 team codes and complete event data (`limit=1000`), and the tool can't give either: it filters by one team and caps at 100 markets. So v3 fixed *discovery* (the tool is now the first move), but the tool doesn't cover everything a coder needs. A possible v4: a mode that lists all events/team codes in a series.
- Caveat: one run per version (n=1 each); the v1→v3 difference is clear, but this isn't a statistic.
- Summary table:

| Version | Change | kalshi_lookup calls | curl/urllib probes before it |
|---|---|---|---|
| v1 | original | 0 | all of them (urllib) |
| v2 | coding-first description, `raw`, nicknames | 4 | 3 blocked curls first |
| v3 | + server `instructions` | 3 (first action) | 0 before; 1 curl + urllib probes after, for data the tool lacks |
