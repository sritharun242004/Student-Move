# Syncing backend/ with upstream

`backend/` is added to this repo as a **git subtree** of `visual-science/Studentmoves-app`. This means upstream history is preserved (squashed) and we can pull future changes without manually copying files.

## Remote

```
git remote -v
# upstream-backend  https://github.com/visual-science/Studentmoves-app.git
```

## Pull upstream changes into backend/

```bash
git subtree pull --prefix=backend upstream-backend main --squash
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
