# ITERATION: what broke and how I fixed it

The before/after versions are in git: `git show 6b14b05:skills/submission-check/SKILL.md` (v1) vs the current file, and the same for `mcp-server/server.js` (v1 in `6b14b05`, v2 in `158ce05`, v3 in `81f1f23`).

## Failure 1: The skill was too rigid

The first version triggered correctly but refused to check the project because it could not find ASSIGNMENT.md. The requirements were already in SPEC.md, but my rule only accepted ASSIGNMENT.md or a brief explicitly named by the user.

I still think the anti-guessing rule was useful. The mistake was making the accepted source too narrow for how my projects actually work. I changed the lookup order to check a user-named file first, then ASSIGNMENT.md, then SPEC.md, and finally a root Markdown file with a Deliverables, Requirements, or Acceptance Criteria heading. The report also has to name the source it used.

In the fresh rerun, the same prompt produced a full report against SPEC.md, including the missing deliverables and unfinished draft banner. That fixed the refusal while keeping the requirement to ground the check in an identifiable brief.

Evidence: `transcripts/run1-checker.md` and `transcripts/rerun-skill-v2-p3-checker.md`.

## Failure 2: Unsupported judgments and a leaked key

When I tested the checker on The Sharp, it marked the Google form, midpoint check-in, and portfolio link MISSING even though it could not verify those things from the repository. It also accepted a README claim as proof of phone support. Both problems came from treating limited evidence as enough for a definite answer.

More seriously, its secret scan printed a live API key and an OIDC token from .env.local. A checker intended to catch problems created another problem through its output. That makes the course’s warning about third-party skills concrete for me: a skill’s helpful purpose does not guarantee that its instructions handle sensitive files safely.

I added CAN’T VERIFY and a DO YOURSELF checklist for external requirements, required implementation evidence instead of README claims, and added explicit instructions never to open .env* files or print secret values.

The rerun classified external items as CAN’T VERIFY, cited CSS for phone support, and redacted the secret-search output. It still returned NOT READY, but for documented unfinished work: the demo TODO and prompt-log placeholders. The rerun showed improvement, although one successful run is not proof that every future secret-handling case is safe.

Evidence: `transcripts/v1-thesharp-checker.md` (secrets redacted) and `transcripts/rerun-skill-v2-thesharp-checker.md`.

## Failure 3: The MCP tool was ignored during coding

The initial Q&A test showed that the agent could call the tool, but it first confused the Bills with Baltimore by using BAL. During the actual coding task, the worker made no MCP calls at all. It tried curl, which was blocked by permissions, then wrote its own urllib requests.

My first diagnosis was that the tool description focused too much on looking up odds and that its simplified output left out fields needed for coding. In v2, I made the description explicitly say to call the tool before writing Kalshi code, added raw: true, and added nickname mapping such as Bills → BUF.

The first rerun was invalid because the clone included the old implementation branch, allowing the worker to merge existing code. I repeated it using a single-branch clone with no remote. That clean v2 run still attempted curl three times (all blocked) before finding the tool, although it then made four MCP calls.

The deeper issue was discovery. The recorded setup deferred MCP tool descriptions until ToolSearch, so my improved description was unavailable when the agent chose its initial approach. In v3, I moved the routing instruction into server-level instructions. After reading the repository and SPEC, the fresh worker searched for the tool and made three calls before trying anything else. Afterward it still tried one curl (blocked) and wrote urllib probes to list every team code, which the tool cannot provide. Each version was run once, so this is one run per version, not a statistic.

Evidence: `transcripts/01-mcp-call-check.md`, `transcripts/run1-worker.md`, `transcripts/rerun-mcp-v2-clean-worker.md`, `transcripts/rerun-mcp-v3-worker.md`.

| Version | Change | kalshi_lookup calls | curl/urllib probes before it |
|---|---|---|---|
| v1 | original | 0 | all of them (urllib) |
| v2 | coding-first description, `raw`, nicknames | 4 | 3 blocked curls first |
| v3 | + server `instructions` | 3 (first action) | 0 before; 1 curl + urllib probes after, for data the tool lacks |
