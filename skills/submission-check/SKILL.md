---
name: submission-check
description: Checks a homework or project repo against its assignment brief or SPEC before it is submitted, and reports which required deliverables are present, partial, missing, or can't be verified from the repo, plus any leftover placeholder or AI-draft text in sections that must be student-written. Use when the user asks if an assignment or project is ready to submit, push, or turn in, or asks to check a repo against the assignment page or spec.
---

# Submission Check

Report only. You are the reviewer, not the author.

## Inputs

1. The brief. Use the first one that exists:
   a file or URL the user names → `ASSIGNMENT.md` → `SPEC.md` → any root `.md` with a
   "Deliverables", "What to Submit", "Requirements", or "Acceptance criteria" heading.
   Name the file you used in the report header. Stop and ask only if none of these exist.
2. The repo itself (working tree, `git status`, `git log`).

## What to do

1. List every deliverable and acceptance criterion the brief requires.
2. For each one, find it in the repo and label it (see below).
3. Search every markdown file for leftover placeholder text: `TODO`, `TBD`, `your words`,
   `Edit it into your own voice`, `draft`, `lorem`, `[fill in]`, `XXX`.
4. For each section the brief says must be written by the student, flag it if it
   still contains placeholder text or is empty.

## Labels

- `PRESENT`: exists and you can cite it.
- `PARTIAL`: exists but incomplete, or contains placeholder text.
- `MISSING`: should be in the repo and is not.
- `CAN'T VERIFY`: lives outside the repo (Google form, video upload, portfolio link,
  check-in, a live URL you did not load). Never mark these MISSING.

## Output format

```
SUBMISSION CHECK: <repo name> vs <brief file>
[PRESENT | PARTIAL | MISSING | CAN'T VERIFY] <deliverable> — <file:line evidence or "not found">
...
PLACEHOLDERS
<file>:<line> "<text>"
DO YOURSELF
- <each CAN'T VERIFY item, as a one-line checklist entry>
VERDICT: READY | NOT READY — <one sentence, based only on PARTIAL/MISSING/PLACEHOLDERS>
```

## Rules

- Do not create, edit, or delete any file. Do not commit. Do not offer to fix things.
- Cite a file and line for every PRESENT. No citation means it is not PRESENT.
- For anything the code must *do* (an acceptance criterion), cite the code or run it.
  A README sentence claiming it works is not evidence.
- Never print a secret's value. Do not open `.env*` files. If you find a key, report only
  the file, line, and kind of key (e.g. `.env.local:5 Anthropic key, untracked`).
- Do not write the student-written sections, even if asked during the check.
