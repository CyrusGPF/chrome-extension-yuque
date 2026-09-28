# AGENTS.md

Project instructions for Codex and other coding agents working in this repository.

## Project Overview

YuqueOut is a Chrome Manifest V3 extension for exporting Yuque knowledge bases to Markdown, Word, PDF, Excel, CSV, HTML, PNG, JPG, and SVG. The product promise is local-first export with zero data upload.

Primary surfaces:

- Extension code: `src/`
- Chrome extension manifest and localization: `manifest.json`, `_locales/`
- Build config: `webpack.config.js`
- Samples and conversion fixtures: `samples/`, `scripts/`

Do not use emoji in UI copy, docs, commit messages, or generated content for this project unless the user explicitly asks for it.

## Commands

Use these commands from the repository root:

```bash
npm install
npm test
npm run build
npm run build:watch
npm run pack
npm run compare:boards
```

Notes:

- `npm run build` outputs to `dist/`.
- `npm run pack` creates `build/chrome-extension-yuque-export.zip`.
- `dist/`, `build/`, `node_modules/`, and `.DS_Store` are ignored and should not be committed.
- `npm test` runs the lightweight Node contract tests for GUID generation and export metadata.

## Architecture

Manifest V3 entry points:

- `src/background.js`: service worker and main coordinator
- `src/popup.html` + `src/popup.js`: main extension UI
- `src/settings.html` + `src/settings.js`: options page
- `src/content/bubble.js`: Yuque page floating export bubble
- `src/offscreen.js`: Chrome Offscreen API for SVG to Canvas to PNG/JPG conversion

Core modules in `src/core/`:

- `yuque.js`: Yuque API wrapper, Cookie auth, RSA password validation
- `exporter.js`: export scheduler and local/API engine selection
- `lake-converter.js`: Lake HTML to Markdown
- `sheet-converter.js`: Lakesheet conversion to xlsx/csv/md/html
- `board-converter.js`: Lakeboard JSON to SVG
- `downloads.js`: `chrome.downloads` save logic
- `task-controller.js`: pause, resume, retry, and per-file task flow
- `messaging.js`: background to popup messaging
- `state.js`: background state
- `constants.js`: shared constants

Popup UI modules live in `src/ui/` and should stay split by responsibility: DOM helpers, state, actions, messaging, password, i18n, constants.

## Engineering Constraints

- Preserve the local-first privacy model. Do not add third-party uploads, telemetry, analytics, or remote processing without explicit user approval.
- Service workers have no browser DOM. Keep DOM parsing in service-worker-compatible code through existing patterns such as `@mixmark-io/domino`.
- Do not break the dual-engine design. Documents and sheets can use local conversion or official API paths depending on permissions and settings.
- Board PNG/JPG export depends on the offscreen document. Keep Canvas work in `src/offscreen.js` or the established offscreen flow.
- When adding user-facing UI text, update both `_locales/zh_CN/messages.json` and `_locales/en/messages.json` when applicable.
- Prefer existing module boundaries and helper functions over new abstractions.
- Avoid unrelated refactors while fixing bugs or adding narrow features.
- Do not overwrite existing image or asset filenames unless the user explicitly asks for replacement. Add a descriptive sibling filename instead.

## Public Release And Privacy

- Treat commit and tag metadata, every public branch and its history, source files, examples, generated extension packages, website pages, release assets, store listings, and public profiles as published material. Checking only the current worktree is insufficient.
- Do not newly expose private real names, personal email addresses or phone numbers, local absolute paths or user directories, private Yuque or Obsidian content, browser cookies, passwords, tokens, keys, or other credentials. Use fictional data in tests, samples, screenshots, and documentation. Preserve upstream commit attribution and legally required notices; do not display upstream contact, store, website, or donation links as this fork's own project information.
- Use the public identity `CyrusGPF` and a GitHub `users.noreply.github.com` address for this project's new commit and tag author metadata. Preserve attribution for upstream contributors; do not rewrite their identities merely to anonymize this fork.
- Before committing, review staged filenames and content. Before publishing, scan the Git references and history that will become public, plus the built extension package, website output, release assets, and visible author/contact details. `.gitignore` does not remove data already present in Git history.
- Keep machine-specific settings such as `.claude/settings.local.json`, environment files, exported vaults, and authentication material out of Git. If private data is found, stop publication, remove it from affected history, and rotate any exposed credentials. Verify the rewritten trees and build output before pushing. Old commit hashes, hosting caches, and other clones may remain accessible after a force push; report that limit and request host-side cleanup when needed.
- Redact sensitive values in audit reports and logs. Give hosting support only the details needed to remove exposed data.

## Verification

Before finishing code changes, run:

```bash
npm test
npm run build
git diff --check
```

For board-converter work, also run `npm run compare:boards`.

## Git And Collaboration

- Check `git status --short` before editing and before final response.
- The worktree may contain user changes. Do not revert changes you did not make.
- Use `rg` or `rg --files` for search.
- Use `apply_patch` for manual file edits.
- Keep commits, pushes, and destructive Git operations for explicit user requests only.
- When reporting completion, include files changed and checks run. If a check was not run, say so.
