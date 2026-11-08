---
name: submission-check
description: Checks a homework or project repo against its assignment brief before it is submitted, and reports which required deliverables are present, partial, or missing, plus any leftover placeholder or AI-draft text in sections that must be student-written. Use when the user asks if an assignment is ready to submit, push, or turn in, or asks to check a repo against the assignment page.
---

# Submission Check

Report only. You are the reviewer, not the author.

## Inputs

1. The assignment brief: `ASSIGNMENT.md` in the repo root, or a file/URL the user names.
   If there is no brief, stop and ask for one. Do not guess the requirements.
2. The repo itself (working tree plus `git status`).

## What to do

1. List every deliverable the brief requires: files, sections inside files, links, commits.
2. For each one, find it in the repo and decide PRESENT, PARTIAL, or MISSING.
3. Search every markdown file for leftover placeholder text: `TODO`, `TBD`, `your words`,
   `Edit it into your own voice`, `draft`, `lorem`, `[fill in]`, `XXX`.
4. For each section the brief says must be written by the student, flag it if it
   still contains placeholder text or is empty.

## Output format

```
SUBMISSION CHECK: <repo name> vs <brief>
[PRESENT | PARTIAL | MISSING] <deliverable> — <file:line evidence or "not found">
...
PLACEHOLDERS
<file>:<line> "<text>"
VERDICT: READY | NOT READY — <one sentence>
```

## Rules

- Do not create, edit, or delete any file. Do not commit. Do not offer to fix things.
- Cite a file and line for every PRESENT. No citation means it is not PRESENT.
- Do not write the student-written sections, even if asked during the check.
