# DEMONSTRATION: the toolkit on real work

> ⚠️ **TODO (your words): this file must be written by Sai (HW8 "What to Submit").** Claude ran the sessions and
> gathered the trimmed transcript excerpts below. **The "Do I agree?" parts can only come from you.** Read the
> checker reports in `transcripts/run1-checker.md` and `transcripts/run2-checker.md` and decide for yourself.

## The task

> TODO (your words): what the task was and why it's real.

FACTS: Project 3 groundwork, a Kalshi NFL line tracker (`~/p3-line-tracker`, local only, not pushed). `SPEC.md` has 4 deliverables
and 5 acceptance criteria. Run 1 = `snapshot.py` (criteria 1–3). Run 2 = `report.py` + README run instructions (criteria 4–5).
Setup for every run: the worker is a fresh `claude -p` on **Opus 5.5**; the checker is a separate fresh `claude -p` on **Sonnet 5.5**
in the same repo after the worker finished, with no shared context. Raw logs are `transcripts/*.jsonl`; trimmed versions are `*.md`
(made by `transcripts/summarize.py`).

## Run 1: `snapshot.py`

**Worker prompt (Opus):** `build snapshot.py from SPEC.md (deliverable 1, acceptance criteria 1-3). make sure it actually works on real data, run it for BUF so there is a real snapshot in data/, then commit`

Trimmed (`transcripts/run1-worker.md`):
```
[session] model=claude-opus-5-5 mcp=[('kalshi-lookup', 'connected')]
  -> TOOL Bash: curl -s "https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNFLGAME..."   <- requires approval (blocked)
  -> TOOL Bash: python3 -c "import urllib.request,json ... /events?series_ticker=KXNFLGAME&status=open"
     <- 28 | KXNFLGAME-26NOV08CINATL | Cincinnati vs Atlanta ...
  -> TOOL Write: snapshot.py
  -> TOOL Bash: python3 snapshot.py XXX   <- error: unknown team code 'XXX' ... (exit 2)
  -> TOOL Bash: python3 snapshot.py BUF   <- wrote 46 rows for 26NOV09BUFMIN (2 moneyline, 25 spread, 19 total)
  -> TOOL Bash: git commit ...  (b9a015b)
```
**The MCP tool was NOT called in this run** (0 calls). That's the failure written up in ITERATION.md (Failure 3).

**Checker (Sonnet), prompt `is this ready to submit`** (`transcripts/run1-checker.md`):
```
  -> TOOL Skill: {"skill": "submission-check"}          <- triggered on its own
AGENT: I can't run the check yet because there's no assignment brief. The repo has no `ASSIGNMENT.md`. The only markdown
       file is `SPEC.md`, which looks like your own project notes ... I won't guess what's required.
```
The skill loaded but refused to run (ITERATION.md Failure 1). After the v2 fix, the same prompt on the same repo
(`transcripts/rerun-skill-v2-p3-checker.md`) gave:
```
SUBMISSION CHECK: p3-line-tracker vs SPEC.md
[PRESENT] Deliverable 1: snapshot.py — snapshot.py:1-222 (main at :189)
[MISSING] Deliverable 2: report.py — not found
[MISSING] Deliverable 3: README.md (...) — not found
[PRESENT] Deliverable 4: data/ with a real snapshot CSV — data/snapshots.csv:1-47 (...committed in b9a015b)
[PRESENT] AC3: unknown team code errors and exits non-zero without writing — snapshot.py:194-197 ...
[MISSING] AC4 / AC5 — report.py does not exist
PLACEHOLDERS
SPEC.md:3 "Drafted with Claude from Sai's choices ... Edit before treating as final."
VERDICT: NOT READY — report.py and README.md are missing ..., and SPEC.md still has its AI-draft note.
```

> TODO (your words): what did the checker catch? Do you agree? (For example: MISSING for report.py is expected, since Run 1
> didn't build it. Is flagging your own SPEC banner fair? It said it read AC3's code but didn't run it. Is that good enough?)

## Run 2: `report.py` + README run instructions

**Worker prompt (Opus):** `next part of SPEC.md: build report.py (acceptance criteria 4-5) and the README run instructions. take a new real BUF snapshot first so the report shows actual line movement, and double check the kalshi numbers in it are right. leave the 'Why I'm building this' section of the README for me to write. commit when done`

Trimmed (`transcripts/run2-worker.md`). This session ran the **v2** server; it started before v3 existed:
```
  -> TOOL ToolSearch: select:mcp__kalshi-lookup__kalshi_lookup
  -> TOOL mcp__kalshi-lookup__kalshi_lookup: {"ticker": "KXNFLGAME-26NOV09BUFMIN", "raw": true}
  -> TOOL mcp__kalshi-lookup__kalshi_lookup: {"ticker": "KXNFLSPREAD-26NOV09BUFMIN", "limit": 50}
  -> TOOL mcp__kalshi-lookup__kalshi_lookup: {"ticker": "KXNFLTOTAL-26NOV09BUFMIN", "limit": 50}
FINAL: New snapshot: taken at 2026-11-08 06:04 UTC ... 46 rows ... I compared every row against Kalshi's live data, and bid,
       ask, last and volume all match. ... Buffalo moneyline went from 61¢ to 62¢; Over 49.5 total points fell from 38¢ to 34¢ ...
       The "Why I'm building this" heading is there with nothing under it, for you to write.   (commit 2bf41b4)
```

**Checker (Sonnet), prompt `is this ready to submit`** (`transcripts/run2-checker.md`):
```
  -> TOOL Skill: {"skill": "submission-check"}
SUBMISSION CHECK: p3-line-tracker vs SPEC.md
[PRESENT] report.py — report.py:136-165 (main), committed in 2bf41b4
[PARTIAL] README.md: how to run both scripts — README.md:9-66 is present and complete
[PARTIAL] README.md: "Why I'm building this" (written by me) — README.md:88 is a heading with nothing under it
[PRESENT] AC3 ... I ran `python3 snapshot.py XXX`. It printed a clear error and exited with code 2.
[PRESENT] AC4 ... I ran `python3 report.py BUF` ... "Buffalo 61c 62c +1c"
[PRESENT] AC5 ... report.py:152-155 and 158-161. I read the code but did not run it with an empty or missing CSV
PLACEHOLDERS
SPEC.md:3 "> Drafted with Claude ..."
README.md:88 "## Why I'm building this" (heading is empty)
VERDICT: NOT READY — the student-written "Why I'm building this" section in README.md is empty, and SPEC.md still has its AI-draft banner.
```

> TODO (your words): what did it catch, and do you agree? Things worth an opinion: it labeled the run instructions
> **PARTIAL** while calling them "present and complete" (a labeling mistake?). It accepted AC5 from reading code without
> running it. It made no edits (`git status` was clean afterward).

## Consistency across runs

> TODO (your words)

FACTS: The skill triggered on its own in **all 5** checker sessions (run1, run1-rerun, run2, The Sharp v1, The Sharp v2), each from
a plain "is this ready to submit" prompt and never by name. After v2, every report used the same format (header naming the brief,
labeled lines with file:line, PLACEHOLDERS, DO YOURSELF, VERDICT). None of the checker sessions modified any file.

## Bonus: checking real past work

`transcripts/rerun-skill-v2-thesharp-checker.md`: The Sharp (Project 2) checked against the original Project 2 brief:
`VERDICT: NOT READY — README.md:5 still says "Demo: TODO", and the "Tools and models" section of prompt_log.md (lines 5-8) is still placeholder text`.
That repo was turned in like that on 10/7.
