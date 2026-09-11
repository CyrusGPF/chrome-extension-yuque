# YuqueOut + Yuque Order Drag

YuqueOut exports the stable identity and original Yuque tree; the companion Obsidian plugin owns the live order after import. File names stay clean and no per-note `order` field is needed.

## Export settings

In **Settings → Export Structure** use these defaults:

- **GUID bits**: 64 by default, with 72 available. Alphanumeric Base62 suffixes use 11 characters for 64 bits and 13 for 72 bits. Files use `f-` and folders use `d-`.
- **`_yuque_order.json`**: always generated once per complete knowledge-base export.
- **Hierarchical number prefixes**: off. Names remain clean.
- **Write order sort field**: off. It is retained only for legacy sorting plugins.
- **Folder-note mode for nested docs**: on. A parent with children is exported as `Parent/Parent.md`.

The manifest has `version: 2`, a unique `exportId`, `guidBits`, final paths, typed GUIDs, and a `directories` array containing each directory's Yuque sibling order. Exported attachments and their parent folders are listed separately in `resources`, so they can be validated and identified without changing Yuque document order. The plugin exposes one explicit **恢复原语雀目录顺序** action. Same-name books selected in one export receive isolated `-1`, `-2` roots, consistently used by documents, attachments, and manifests. Markdown and non-Markdown files use `f-` identities, folders use `d-` identities, and no README file is generated.

## Install and use

Build `YQSorting` with `npm install` and `npm run build`, then copy `main.js`, `manifest.json`, and `styles.css` into:

```text
<vault>/.obsidian/plugins/yuque-order-drag/
```

Enable **Yuque Order Drag** in Obsidian. It scans Markdown files, adds a stable `guid` to older notes, creates identities for ordinary folders in plugin `data.json`, and waits for an explicit manifest initialization.

1. Drag items to reorder siblings in the File Explorer.
2. Drag an item onto a folder, or onto a folder note that already has a matching folder, to move it into that folder.
3. Use **恢复原语雀目录顺序**. New export IDs adopt identities once; later runs restore order without overwriting regenerated GUIDs.

Order is stored as `orderByFolder[folderGuid] = [childGuid, ...]`. Renaming or moving a Markdown file keeps its identity because the guid travels in frontmatter. Deleting a file removes only its guid; neighboring items are not renumbered. New notes are inserted at the configured top/bottom position.

## Limitations

- The File Explorer hook targets Obsidian's internal `Folder.sort` implementation. It is guarded; if a future release changes it, the plugin falls back to the default tree order without modifying notes.
- Markdown files changed through Windows Explorer are resilient because their guid is in the file. Ordinary folder identities live in `data.json`, so structural folder rename/move is safer inside Obsidian.
- Order lives in plugin `data.json`. Sync that plugin data across devices; a consumed `exportId` is reapplied only through the explicit restore command.
