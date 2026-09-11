/**
 * Assign one final root per knowledge base for the lifetime of an export task.
 * The original bookName is retained; every path builder reads exportBookName.
 */
export function assignUniqueBookRoots(files, sanitizePathSegments) {
  const groups = new Map();
  for (const file of files || []) {
    if (!file || file.bookId === undefined || file.bookId === null) continue;
    const id = String(file.bookId);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(file);
  }

  const used = new Set();
  const renamed = [];
  for (const [bookId, bookFiles] of groups) {
    const segments = sanitizePathSegments(bookFiles[0].bookName || bookId);
    const baseSegments = segments.length ? segments : [bookId];
    const basePath = baseSegments.join('/');
    let finalPath = basePath;
    let suffix = 1;
    while (used.has(finalPath.toLocaleLowerCase())) {
      const candidate = baseSegments.slice();
      candidate[candidate.length - 1] = `${candidate[candidate.length - 1]}-${suffix}`;
      finalPath = candidate.join('/');
      suffix += 1;
    }
    used.add(finalPath.toLocaleLowerCase());
    for (const file of bookFiles) file.exportBookName = finalPath;
    if (finalPath !== basePath) renamed.push({ bookId, from: basePath, to: finalPath });
  }
  return renamed;
}
