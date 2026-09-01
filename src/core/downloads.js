import { exportState } from './state.js';
import { sanitizePathComponent, sanitizePathSegments, buildExportRelativeSegments } from './utils.js';

const pendingDownloadUrlMap = new Map();
const downloadFilenameOverrides = new Map();
const activeDownloadTargets = new Map();
const activeDownloadWaiters = new Map();
let hooksInitialized = false;
const DOWNLOAD_WAIT_TIMEOUT = 5 * 60 * 1000;

function enqueuePendingDownload(url, filename) {
  const queue = pendingDownloadUrlMap.get(url) || [];
  queue.push(filename);
  pendingDownloadUrlMap.set(url, queue);
}

function consumePendingDownload(url) {
  const queue = pendingDownloadUrlMap.get(url);
  if (!queue?.length) return '';

  const targetPath = queue.shift();
  if (!queue.length) {
    pendingDownloadUrlMap.delete(url);
  } else {
    pendingDownloadUrlMap.set(url, queue);
  }
  return targetPath || '';
}

function handleDownloadCreated(downloadItem) {
  const targetPath = consumePendingDownload(downloadItem.url);
  if (targetPath) {
    downloadFilenameOverrides.set(downloadItem.id, targetPath);
    activeDownloadTargets.set(downloadItem.id, {
      expectedFilename: targetPath,
      sourceUrl: summarizeUrl(downloadItem.url)
    });
  }
}

function handleDownloadFilename(downloadItem, suggest) {
  const targetPath = downloadFilenameOverrides.get(downloadItem.id);
  if (targetPath) {
    downloadFilenameOverrides.delete(downloadItem.id);
    suggest({ filename: targetPath, conflictAction: resolveConflictAction() });
    return;
  }
  suggest();
}

// 'overwrite' (default): re-exporting overwrites the same file instead of
// creating '(1)' copies; 'uniquify': keep copies (legacy behavior).
function resolveConflictAction() {
  return exportState.fileConflict === 'uniquify' ? 'uniquify' : 'overwrite';
}

function handleDownloadChanged(delta) {
  const target = activeDownloadTargets.get(delta.id);
  const waiter = activeDownloadWaiters.get(delta.id);
  if (!target && !waiter) return;

  if (delta.error?.current || delta.state?.current === 'interrupted' || delta.state?.current === 'complete') {
    settleDownloadWaiter(
      delta.id,
      delta.error?.current || delta.state?.current === 'interrupted'
        ? new Error(delta.error?.current || '下载被中断')
        : null
    );
  }
}

export function initDownloadHooks() {
  if (hooksInitialized) return;
  hooksInitialized = true;

  if (chrome?.downloads?.onChanged) {
    chrome.downloads.onChanged.addListener(handleDownloadChanged);
  }
  if (chrome?.downloads?.onCreated) {
    chrome.downloads.onCreated.addListener(handleDownloadCreated);
  }
  if (chrome?.downloads?.onDeterminingFilename) {
    chrome.downloads.onDeterminingFilename.addListener(handleDownloadFilename);
  }
}

/**
 * Save text content to disk via data URL.
 */
export async function saveContentToDisk(content, file, extension, mime) {
  const relativePath = buildRelativeDownloadPath(file, extension);
  const dataUrl = `data:${mime};charset=utf-8,${encodeURIComponent(content)}`;
  await download(dataUrl, relativePath);
  return relativePath;
}

/**
 * Save text content to an explicit relative path (e.g. generated index files).
 */
export async function saveTextToRelativePath(content, relativePath, mime) {
  const dataUrl = `data:${mime || 'text/plain'};charset=utf-8,${encodeURIComponent(content)}`;
  await download(dataUrl, relativePath);
  return relativePath;
}

/**
 * Save a Blob to disk via data URL.
 * MV3 service workers do not reliably support object URLs.
 */
export async function saveBlobToDisk(blob, relativePath) {
  const dataUrl = await blobToDataUrl(blob);
  await download(dataUrl, relativePath);
  return relativePath;
}

/**
 * Download a file from URL directly (CDN images, OSS exports, etc.).
 */
export async function downloadUrlToDisk(url, relativePath) {
  await download(url, relativePath);
  return relativePath;
}

function download(url, filename) {
  const normalizedFilename = normalizeRelativePath(filename);
  enqueuePendingDownload(url, normalizedFilename);

  return new Promise((resolve, reject) => {
    let settled = false;
    let downloadId = null;
    const timer = setTimeout(() => {
      if (downloadId !== null) {
        settleDownloadWaiter(downloadId, new Error('下载等待超时'));
      } else if (!settled) {
        settled = true;
        removeQueuedDownload(url, normalizedFilename);
        reject(new Error('下载启动超时'));
      }
    }, DOWNLOAD_WAIT_TIMEOUT);

    const waiter = {
      resolve: () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      },
      reject: (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    };

    chrome.downloads.download({
      url,
      filename: normalizedFilename,
      saveAs: false,
      conflictAction: resolveConflictAction()
    }, (id) => {
      if (chrome.runtime.lastError) {
        clearTimeout(timer);
        settled = true;
        removeQueuedDownload(url, normalizedFilename);
        reject(new Error(chrome.runtime.lastError.message));
      } else if (typeof id !== 'number') {
        clearTimeout(timer);
        settled = true;
        removeQueuedDownload(url, normalizedFilename);
        reject(new Error('下载启动失败'));
      } else {
        downloadId = id;
        activeDownloadWaiters.set(id, waiter);
        reconnectDownloadState(id);
      }
    });
  });
}

function settleDownloadWaiter(id, error = null) {
  const waiter = activeDownloadWaiters.get(id);
  if (waiter) {
    if (error) waiter.reject(error);
    else waiter.resolve();
    activeDownloadWaiters.delete(id);
  }
  activeDownloadTargets.delete(id);
  downloadFilenameOverrides.delete(id);
}

function reconnectDownloadState(id) {
  chrome.downloads.search({ id }, (items) => {
    if (chrome.runtime.lastError) {
      settleDownloadWaiter(id, new Error(chrome.runtime.lastError.message));
      return;
    }
    const item = items?.[0];
    if (!item) return;
    if (item.error || item.state === 'interrupted') {
      settleDownloadWaiter(id, new Error(item.error || '下载被中断'));
    } else if (item.state === 'complete') {
      settleDownloadWaiter(id);
    }
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Blob 转 DataURL 失败'));
    reader.readAsDataURL(blob);
  });
}

function buildRelativeDownloadPath(file, extension) {
  // Shared with exporter.js buildFilePath: hierarchical order prefixes and
  // folder-note layout keep every save path consistent with the Yuque TOC.
  return buildExportRelativeSegments(file, extension, {
    subfolder: exportState.subfolder || '',
    useOrderPrefix: exportState.useOrderPrefix,
    useFolderNote: exportState.useFolderNote,
  }).join('/');
}

function normalizeRelativePath(path = '') {
  return sanitizePathSegments(path).join('/');
}

function removeQueuedDownload(url, filename) {
  const queue = pendingDownloadUrlMap.get(url);
  if (!queue?.length) return;

  const index = queue.indexOf(filename);
  if (index >= 0) queue.splice(index, 1);

  if (!queue.length) pendingDownloadUrlMap.delete(url);
  else pendingDownloadUrlMap.set(url, queue);
}

function summarizeUrl(url = '') {
  if (url.startsWith('data:')) return 'data:...';
  return url.length > 120 ? `${url.slice(0, 117)}...` : url;
}
