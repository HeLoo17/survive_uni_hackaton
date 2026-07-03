# AGENTS.md

## Cursor Cloud specific instructions

### Current repository state

As of this writing, this repository (`survive_uni_hackaton`) is a **placeholder**: it
contains only `README.md` and `LICENSE`. There is **no application code**, no dependency
manifest (no `package.json`, `requirements.txt`, `pyproject.toml`, etc.), no build system,
and no setup scripts on any branch.

Because of this:

- There is nothing to install, build, lint, test, or run yet.
- The startup **update script is intentionally a no-op**. Once actual application code and
  a dependency manifest are added, update the Cursor Cloud environment update script to
  install those dependencies (for a Node webapp this would typically be `npm install` /
  `pnpm install`; for Python, `pip install -r requirements.txt` or `uv sync`, etc.).
- When the stack is chosen, replace this section with the real dev/lint/test/build/run
  commands (or point to the README / `package.json` scripts / `Makefile` once they exist).
