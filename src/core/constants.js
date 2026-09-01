export const YUQUE_API = {
  BASE: 'https://www.yuque.com/api',
  MINE: 'https://www.yuque.com/api/mine',
  BOOK_STACKS: 'https://www.yuque.com/api/mine/book_stacks',
  COLLAB_BOOKS: 'https://www.yuque.com/api/mine/raw_collab_books',
  GROUP_BOOKS: 'https://www.yuque.com/api/mine/user_books?user_type=Group',
  HOME_PAGE: 'https://www.yuque.com',
  CDN_HOSTS: ['cdn.nlark.com', 'cdn.yuque.com', 'cdn-china-mainland.yuque.com', 'gw.alipayobjects.com'],
};

export const DOC_TYPES = {
  DOC:   'Doc',
  SHEET: 'Sheet',
  BOARD: 'Board',
  TABLE: 'Table',
};

// Types we can export to standard formats
export const SUPPORTED_DOC_TYPES = new Set([DOC_TYPES.DOC, DOC_TYPES.SHEET, DOC_TYPES.TABLE, DOC_TYPES.BOARD]);

// Export format definitions (our internal format keys)
export const EXPORT_FORMATS = {
  md:   { extension: 'md',   label: 'Markdown (.md)' },
  docx: { extension: 'docx', label: 'Word (.docx)' },
  pdf:  { extension: 'pdf',  label: 'PDF (.pdf)' },
  jpg:  { extension: 'jpg',  label: 'JPG (.jpg)' },
  png:  { extension: 'png',  label: 'PNG (.png)' },
  svg:  { extension: 'svg',  label: 'SVG (.svg)' },
  xlsx: { extension: 'xlsx', label: 'Excel (.xlsx)' },
  csv:  { extension: 'csv',  label: 'CSV (.csv)' },
  html: { extension: 'html', label: 'HTML (.html)' },
};

// Per doc-type: available formats, default, and the ACTUAL API "type" param
// CRITICAL: apiType is what the server accepts, NOT our format key
export const DOC_TYPE_EXPORT_OPTIONS = {
  [DOC_TYPES.DOC]: {
    formats: ['md', 'docx', 'pdf', 'jpg'],
    defaultFormat: 'md',
    apiTypeMap: { md: 'markdown', docx: 'word', pdf: 'pdf', jpg: 'jpg' },
  },
  [DOC_TYPES.SHEET]: {
    formats: ['xlsx', 'csv', 'md', 'html'],
    defaultFormat: 'xlsx',
    apiTypeMap: { xlsx: 'excel' },
  },
  [DOC_TYPES.BOARD]: {
    formats: ['png', 'jpg', 'svg'],
    defaultFormat: 'png',
    apiTypeMap: {},
  },
  [DOC_TYPES.TABLE]: {
    formats: ['xlsx', 'csv', 'md'],
    defaultFormat: 'xlsx',
    apiTypeMap: { xlsx: 'excel' },
  },
};

// Options passed to the export API per apiType
export const EXPORT_OPTIONS = {
  // latexType:2 = raw editable LaTeX (1 = LaTeX as image)
  // enableAnchor:1 = keep Yuque anchors
  // enableBreak:1 = keep line breaks
  // useMdai:1 = export PlantUML and extra card content
  markdown: '{"latexType":2,"enableAnchor":1,"enableBreak":1,"useMdai":1}',
  pdf:      '{"enableToc":1}',
};

// "Smart export" uses per-type defaults
export const SMART_EXPORT_KEY = 'smart';

export const DEFAULT_SETTINGS = {
  exportType: 'smart',
  requestInterval: 500,
  subfolder: '语雀备份',
  downloadImages: true,       // Download CDN images to local assets/ for Markdown
  imageConcurrency: 3,
  docExportFormat: 'md',
  sheetExportFormat: 'xlsx',
  boardExportFormat: 'png',
  tableExportFormat: 'xlsx',
  skipEncryptedBookmarks: false, // 收藏中跳过加密文档/知识库
  markdownMode: 'local',         // 'local' = Lake HTML本地转换, 'api' = 官方导出API
  sheetMode: 'local',            // 'local' = 本地引擎, 'api' = 官方导出API（仅xlsx，仅有权限的文档）
  // Obsidian 友好导出结构（默认开启，可关闭恢复旧行为）
  useOrderPrefix: true,          // 文件名/目录名加层级序号前缀，保留语雀目录顺序（如 01-章节/01-01-文档.md）
  useFolderNote: true,           // 嵌套文档使用 Obsidian 文件夹笔记模式：父文档存为 父/父.md
  generateReadme: true,          // 知识库根目录生成 README.md 顺序索引
  // 图片/附件目录模式：'book' = 每个知识库根目录一个 attachments/（多库共用一个 vault 时互不干扰）
  //                 'doc' = 每篇文档自己的 assets/（旧行为）
  attachmentMode: 'book',
  // 附件文件夹名称（按知识库集中时使用），默认 'attachment'
  attachmentFolderName: 'attachment',
  // 文件名冲突处理：'overwrite' = 重导同名直接覆盖（不留副本，推荐）；'uniquify' = 自动加 (1) 保留副本（旧行为）
  fileConflict: 'overwrite',
  // 每次导出前弹窗提醒检查目标路径是否有重名目录（可关闭，即"不再提示"）
  exportConfirm: true,
};

export const EXPORT_POLL_MAX = 3;
export const EXPORT_POLL_INTERVAL = 3000;

// Bookmarks (收藏) virtual book
export const BOOKMARKS_VIRTUAL_BOOK_ID = '__bookmarks__';
export const BOOKMARKS_VIRTUAL_BOOK_NAME = '收藏';
export const BOOKMARKS_LOOSE_DOCS_FOLDER = '单篇收藏';

// RSA public key for Yuque password encryption
export const YUQUE_RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCfwyOyncSrUTmkaUPsXT6UUdXx
TQ6a0wgPShvebfwq8XeNj575bUlXxVa/ExIn4nOUwx6iR7vJ2fvz5Ls750D051S7
q70sevcmc8SsBNoaMQtyF/gETPBSsyWv3ccBJFrzZ5hxFdlVUfg6tXARtEI8rbIH
su6TBkVjk+n1Pw/ihQIDAQAB
-----END PUBLIC KEY-----`;
