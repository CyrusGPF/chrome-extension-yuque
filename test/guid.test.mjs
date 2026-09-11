import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGuidToken, createTypedGuid, pairedGuid } from '../src/core/guid.mjs';
import { assignUniqueNames } from '../src/core/export-names.mjs';
import { assignUniqueBookRoots } from '../src/core/book-roots.mjs';

test('64 and 72 bit GUIDs use alphanumeric Base62 suffixes', () => {
  assert.match(createTypedGuid('f', 64), /^f-[A-Za-z0-9]{11}$/);
  assert.match(createTypedGuid('d', 72), /^d-[A-Za-z0-9]{13}$/);
});

test('paired identities share only their encoded token', () => {
  const file = createTypedGuid('f', 64);
  const folder = pairedGuid('d', file);
  assert.equal(folder.slice(2), file.slice(2));
  assert.notEqual(folder, file);
});

test('collision detection retries without growing per-item state', () => {
  let call = 0;
  const random = { getRandomValues(bytes) { bytes.fill(call++ < 1 ? 0 : 1); return bytes; } };
  const used = new Set(['f-00000000000']);
  const guid = createTypedGuid('f', 64, used, random);
  assert.notEqual(guid, 'f-00000000000');
  assert.equal(used.size, 2);
});

test('invalid bit selection safely falls back to 64 bit', () => {
  assert.equal(createGuidToken(128).length, 11);
});

test('a child matching its parent folder-note name gets a collision-free final path', () => {
  const children = [{ base: '浮点数的表示', order: 1 }];
  assignUniqueNames(children, new Set(['浮点数的表示']));
  assert.equal(children[0].name, '浮点数的表示-1');
});

test('same-name knowledge bases receive isolated stable roots in one task', () => {
  const files = [
    { bookId: 1, bookName: '项目', title: 'A' },
    { bookId: 1, bookName: '项目', title: 'B' },
    { bookId: 2, bookName: '项目', title: 'C' },
    { bookId: 3, bookName: '项目-1', title: 'D' },
  ];
  const sanitize = value => String(value).split('/').filter(Boolean);
  const renamed = assignUniqueBookRoots(files, sanitize);
  assert.equal(files[0].exportBookName, '项目');
  assert.equal(files[1].exportBookName, '项目');
  assert.equal(files[2].exportBookName, '项目-1');
  assert.equal(files[3].exportBookName, '项目-1-1');
  assert.deepEqual(renamed.map(item => item.to), ['项目-1', '项目-1-1']);
});

test('the exporter writes V2 order manifests and never invokes README generation', async () => {
  const source = await readFile(new URL('../src/core/exporter.js', import.meta.url), 'utf8');
  assert.match(source, /version: 2,/);
  assert.match(source, /directories:/);
  assert.match(source, /exportId:/);
  assert.match(source, /fileUsed\.add\(parentNode\.name\)/);
  assert.match(source, /fileUsed\.add\(parentNode\.name\)/);
  assert.doesNotMatch(source, /await generateReadmeIndex\(\)/);
  assert.doesNotMatch(source, /`yq-\$\{/);
});
