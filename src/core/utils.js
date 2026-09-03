export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const MAX_PATH_COMPONENT_LENGTH = 120;

export function sanitizePathComponent(name) {
  if (!name || typeof name !== 'string') return '';

  let result = name.normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\\/<>:"|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/[. ]+$/g, '')
    .trim()
    .replace(/^\.+|\.+$/g, '');

  if (!result) return '';

  if (WINDOWS_RESERVED_NAMES.test(result)) {
    result = `_${result}`;
  }

  if (result.length > MAX_PATH_COMPONENT_LENGTH) {
    result = result.slice(0, MAX_PATH_COMPONENT_LENGTH).replace(/[. ]+$/g, '');
  }

  return result;
}

export function sanitizePathSegments(pathString = '') {
  if (!pathString) return [];
  return pathString
    .split(/[\\/]+/)
    .map(segment => sanitizePathComponent(segment))
    .filter(Boolean);
}

export function formatDate(date) {
  const d = date || new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

export function guessImageExt(url) {
  if (!url) return 'png';
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (match) {
    const ext = match[1].toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
      return ext;
    }
  }
  return 'png';
}

export function escapeXml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Pad a number with leading zeros. Minimum width 2, grows as needed
 * so 1 -> "01", 100 -> "100" (keeps lexicographic ordering stable).
 */
export function padNumber(n, width = 2) {
  const num = Number.isFinite(Number(n)) ? Number(n) : 0;
  const str = String(num);
  return str.padStart(Math.max(width, str.length), '0');
}

/**
 * Full hierarchy order label, e.g. [1,1,2] -> "1.1.2".
 * Used for the YAML frontmatter `order` field (Obsidian sorting plugins).
 */
export function formatOrderLabel(orderSegments) {
  if (!Array.isArray(orderSegments) || !orderSegments.length) return '';
  return orderSegments.join('.');
}

/**
 * Return the stable identity used by the Obsidian order plugin.
 * Yuque document ids are preferred; the generated fallback is cached on the
 * in-memory export item so one export run never changes an id accidentally.
 */
export function getYuqueGuid(file) {
  if (file?.guid) return String(file.guid);
  if (file?.id !== undefined && file?.id !== null && String(file.id)) {
    file.guid = `yq-${String(file.id)}`;
    return file.guid;
  }

  const randomUuid = globalThis.crypto?.randomUUID?.();
  file.guid = `obs-${randomUuid || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  return file.guid;
}

/**
 * Build Obsidian-friendly relative path segments for an exported file.
 * Shared by exporter.js and downloads.js so every save path stays consistent.
 *
 * With useOrderPrefix: folder segments get their sibling-order prefix
 * (01-章节/) and file names get their sibling-order prefix (01-标题.md),
 * which makes Obsidian's file tree sort exactly like the Yuque TOC.
 *
 * With useFolderNote: a parent doc (hasChildren) exported as md is saved
 * inside its own same-named folder (01-父/01-父.md) — Obsidian folder-note
 * convention.
 *
 * @returns {string[]} relative path segments (caller joins with '/')
 */
export function buildExportRelativeSegments(file, extension, opts = {}) {
  const {
    subfolder = '',
    useOrderPrefix = false,
    useFolderNote = false,
    includeBookName = true,
  } = opts;

  const segments = [];
  if (subfolder) segments.push(...sanitizePathSegments(subfolder));
  if (includeBookName && file?.bookName) segments.push(...sanitizePathSegments(file.bookName));

  const hasOrder = Boolean(
    useOrderPrefix &&
    Array.isArray(file?.orderSegments) &&
    file.orderSegments.length > 0
  );

  // Parent chain folders, each with its sibling-order prefix when enabled.
  if (Array.isArray(file?.folderSegments) && file.folderSegments.length) {
    file.folderSegments.forEach((title, i) => {
      const seg = sanitizePathComponent(title);
      if (!seg) return;
      segments.push(hasOrder ? `${padNumber(file.folderOrders?.[i])}-${seg}` : seg);
    });
  } else if (file?.folderPath) {
    // Legacy fallback: docs without TOC order info (bookmarks, quick export)
    // keep their precomputed folderPath as-is.
    segments.push(...sanitizePathSegments(file.folderPath));
  }

  // Base file name (no extension), with sibling-order prefix when enabled.
  const title = sanitizePathComponent(file?.title) || '未命名文档';
  const baseName = hasOrder ? `${padNumber(file.siblingOrder)}-${title}` : title;

  // Folder-note mode: parent docs (with children) exported as md live inside
  // their own same-named folder so Obsidian treats the folder as that note.
  const isFolderNote = Boolean(useFolderNote && file?.hasChildren && extension === 'md');
  if (isFolderNote) {
    segments.push(baseName);
  }

  segments.push(`${baseName}.${extension}`);
  return segments;
}

/**
 * Prepend (or merge into) YAML frontmatter with the hierarchy `order` field.
 * Ready for Obsidian sorting plugins like Obsidian Custom Sort.
 */
export function withOrderFrontmatter(mdText, file) {
  if (!Array.isArray(file?.orderSegments) || !file.orderSegments.length) return mdText;
  const order = formatOrderLabel(file.orderSegments);
  const text = String(mdText || '');

  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (match) {
    const body = match[0];
    if (/^order\s*:/m.test(match[1])) return text;
    // Insert order into the existing frontmatter block.
    const insertAt = match[0].indexOf('\n', 4); // after "---\n"
    return text.slice(0, insertAt + 1) + `order: ${order}\n` + text.slice(insertAt + 1);
  }

  return `---\norder: ${order}\n---\n\n${text}`;
}

/**
 * Merge the V1 identity field and the optional legacy order field into the
 * existing Markdown frontmatter without overwriting user-defined keys.
 */
export function withExportFrontmatter(mdText, file, options = {}) {
  const { writeGuid = true, writeOrderField = false } = options;
  const fields = [];
  const guid = getYuqueGuid(file);
  const text = String(mdText || '');
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  const frontmatter = match?.[1] || '';

  if (writeGuid && !/^guid\s*:/m.test(frontmatter)) {
    fields.push(`guid: ${guid}`);
  }
  if (
    writeOrderField &&
    Array.isArray(file?.orderSegments) &&
    file.orderSegments.length &&
    !/^order\s*:/m.test(frontmatter)
  ) {
    fields.push(`order: ${formatOrderLabel(file.orderSegments)}`);
  }

  if (!fields.length) return text;
  if (match) {
    const insertAt = match[0].indexOf('\n', 4);
    return text.slice(0, insertAt + 1) + fields.map(field => `${field}\n`).join('') + text.slice(insertAt + 1);
  }
  return `---\n${fields.join('\n')}\n---\n\n${text}`;
}

/**
 * Escape a relative path for use as a Markdown link target.
 */
export function escapeMarkdownLinkPath(relPath) {
  return String(relPath || '')
    .replace(/\\/g, '/')
    .replace(/ /g, '%20')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}
