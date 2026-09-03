# YuqueOut + Yuque Order Drag V1

YuqueOut exports the stable identity and original Yuque tree; the companion Obsidian plugin owns the live order after import. File names stay clean and no per-note `order` field is needed.

## Export settings

In **Settings → Export Structure** use these V1 defaults:

- **Write stable guid**: on. Markdown frontmatter receives `guid: yq-<Yuque document id>`.
- **Generate `_yuque_order.json`**: on. One manifest is written at each knowledge-base root.
- **Hierarchical number prefixes**: off. Names remain clean.
- **Write order sort field**: off. It is retained only for legacy sorting plugins.
- **Folder-note mode for nested docs**: on. A parent with children is exported as `Parent/Parent.md`.

The manifest has `version: 1`, `source: "yuque"`, `book`, `generatedAt`, and a `tree` whose nodes contain `guid`, `title`, `order`, and `children`. Its array order is used when the Obsidian plugin seeds or re-syncs. Attachments, README files, and other non-Markdown files do not receive guids and are not sortable items.

## Install and use

Build `YQSorting` with `npm install` and `npm run build`, then copy `main.js`, `manifest.json`, and `styles.css` into:

```text
<vault>/.obsidian/plugins/yuque-order-drag/
```

Enable **Yuque Order Drag** in Obsidian. It scans Markdown files, adds a stable `guid` to older notes, creates identities for ordinary folders in plugin `data.json`, and seeds order from a changed `_yuque_order.json`.

1. Drag items to reorder siblings in the File Explorer.
2. Drag an item onto a folder, or onto a folder note that already has a matching folder, to move it into that folder.
3. Use **导入/重同步语雀顺序清单** after a later Yuque export should become the current order again.

Order is stored as `orderByFolder[folderGuid] = [childGuid, ...]`. Renaming or moving a Markdown file keeps its identity because the guid travels in frontmatter. Deleting a file removes only its guid; neighboring items are not renumbered. New notes are inserted at the configured top/bottom position.

## Limitations

- The File Explorer hook targets Obsidian's internal `Folder.sort` implementation. It is guarded; if a future release changes it, the plugin falls back to the default tree order without modifying notes.
- Markdown files changed through Windows Explorer are resilient because their guid is in the file. Ordinary folder identities live in `data.json`, so structural folder rename/move is safer inside Obsidian.
- Order lives in plugin `data.json`. Sync that plugin data across devices, or run the manifest command to seed again.
