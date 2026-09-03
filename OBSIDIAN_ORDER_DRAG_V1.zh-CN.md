# YuqueOut + Yuque 顺序拖拽 V1

YuqueOut 负责导出稳定身份和原始语雀目录树；配套的 Obsidian 插件负责导入后的实时顺序。文件名保持简洁，不需要为每篇笔记写入单独的 `order` 字段。

## 导出设置

在 **设置 → 导出结构** 中使用以下 V1 默认配置：

- **写入稳定 guid**：开启。Markdown 文件的 frontmatter 中会写入 `guid: yq-<语雀文档 ID>`。
- **生成 `_yuque_order.json`**：开启。每个知识库根目录都会写入一份清单文件。
- **层级编号前缀**：关闭。文件名保持简洁。
- **写入 order 排序字段**：关闭。该选项仅为旧版排序插件保留。
- **嵌套文档使用文件夹笔记模式**：开启。包含子文档的父文档会导出为 `Parent/Parent.md`。

清单文件包含 `version: 1`、`source: "yuque"`、`book`、`generatedAt`，以及一个 `tree` 树形结构。树节点包含 `guid`、`title`、`order` 和 `children`。插件初始化或重新同步时，会使用数组中的顺序。附件、README 文件和其他非 Markdown 文件不会写入 guid，也不会作为可排序项目。

## 安装与使用

在 `YQSorting` 目录执行 `npm install` 和 `npm run build`，然后将 `main.js`、`manifest.json` 和 `styles.css` 复制到：

```text
<仓库>/.obsidian/plugins/yuque-order-drag/
```

在 Obsidian 中启用 **Yuque Order Drag**。插件会扫描 Markdown 文件，为旧笔记补充稳定的 `guid`；同时在插件的 `data.json` 中为普通文件夹创建身份，并根据发生变化的 `_yuque_order.json` 初始化顺序。

1. 在文件列表中拖拽项目，可以调整同级项目的顺序。
2. 将项目拖到文件夹，或拖到一个已经存在对应文件夹的文件夹笔记上，可以将项目移动到该文件夹中。
3. 后续再次从语雀导出并希望恢复语雀顺序时，执行 **导入/重同步语雀顺序清单**。

顺序存储为 `orderByFolder[folderGuid] = [childGuid, ...]`。重命名或移动 Markdown 文件不会丢失身份，因为 guid 会随 frontmatter 一起保留。删除文件时只会移除它的 guid，不会重新编号相邻项目。新建笔记会按照配置插入到顶部或底部。

## 限制

- 文件列表的拦截依赖 Obsidian 内部的 `Folder.sort` 实现，并且带有保护逻辑。如果未来版本发生变化，插件会回退到默认树顺序，不会修改笔记。
- 通过 Windows 资源管理器修改 Markdown 文件通常是安全的，因为 guid 保存在文件中。普通文件夹的身份保存在 `data.json` 中，因此文件夹的结构性重命名或移动最好在 Obsidian 内完成。
- 顺序保存在插件的 `data.json` 中。跨设备使用时请同步该插件数据，或者再次执行清单命令进行初始化。
