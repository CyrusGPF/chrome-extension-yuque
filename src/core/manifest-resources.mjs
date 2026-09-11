function normalize(path) {
  return String(path || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

/** Record a successfully written auxiliary file once; retries reuse its GUID. */
export function recordExportedResource(file, path, createGuid) {
  const normalizedPath = normalize(path);
  if (!file || !normalizedPath) return null;
  if (!Array.isArray(file.exportedResources)) file.exportedResources = [];
  const existing = file.exportedResources.find(item => item?.path === normalizedPath && item?.kind === 'file');
  if (existing) return existing;
  const resource = { path: normalizedPath, kind: 'file', guid: createGuid('file', normalizedPath) };
  file.exportedResources.push(resource);
  return resource;
}

/**
 * Build manifest resources relative to one knowledge-base root. Parent folders
 * are emitted once, while folders already represented by the Yuque TOC remain
 * owned by directories[].
 */
export function buildAuxiliaryResources(files, rootPath, knownDirectoryPaths, createGuid) {
  const root = normalize(rootPath);
  const prefix = root ? `${root}/` : '';
  const known = new Set(Array.from(knownDirectoryPaths || [], normalize));
  const byPath = new Map();

  const addFolder = (path) => {
    if (!path || known.has(path) || byPath.has(path)) return;
    const parent = path.split('/').slice(0, -1).join('/');
    addFolder(parent);
    byPath.set(path, { path, kind: 'folder', guid: createGuid('folder', path) });
  };

  for (const file of files || []) {
    for (const resource of file?.exportedResources || []) {
      const fullPath = normalize(resource?.path);
      if (!fullPath || (prefix && !fullPath.startsWith(prefix))) continue;
      const relativePath = prefix ? fullPath.slice(prefix.length) : fullPath;
      if (!relativePath || byPath.has(relativePath)) continue;
      addFolder(relativePath.split('/').slice(0, -1).join('/'));
      byPath.set(relativePath, { path: relativePath, kind: 'file', guid: resource.guid });
    }
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));
}
