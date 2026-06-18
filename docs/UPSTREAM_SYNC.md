# Syncing backend/ and web/ with upstream

Both `backend/` and `web/` are added to this repo as **git subtrees** of their upstream repos. This means upstream history is preserved (squashed) and we can pull future changes without manually copying files.

## Remotes

```
git remote -v
# upstream-backend  https://github.com/visual-science/Studentmoves-app.git  (NestJS, mounted at backend/)
# upstream-web      https://github.com/visual-science/StudentMoves.git      (Next.js + Django, mounted at web/)
# origin            https://github.com/sritharun242004/Student-Move.git
```

## Pull upstream changes

```bash
# NestJS backend
git subtree pull --prefix=backend upstream-backend main --squash

# Web (Next.js + Django)
git subtree pull --prefix=web upstream-web main --squash
```

This creates a merge commit at the monorepo root. Resolve conflicts in `backend/` as you would for any merge.

## Push backend changes back to upstream (rarely)

Only if you want to contribute fixes back to `visual-science/Studentmoves-app`:

```bash
git subtree push --prefix=backend upstream-backend <some-branch>
```

You'd then open a PR from `<some-branch>` on the upstream repo.

## Day-to-day

Just edit files in `backend/` and commit at the monorepo root. The subtree is invisible from a normal-development perspective — it only matters when you want to sync upstream.
