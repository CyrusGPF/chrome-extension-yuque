import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuxiliaryResources, recordExportedResource } from '../src/core/manifest-resources.mjs';

test('auxiliary resources keep stable identities across retries and are isolated by book root', () => {
  const file = {};
  let sequence = 0;
  const createGuid = kind => `${kind === 'folder' ? 'd' : 'f'}-${String(++sequence).padStart(11, '0')}`;
  const first = recordExportedResource(file, '前端/attachment/a.png', createGuid);
  const retry = recordExportedResource(file, '前端/attachment/a.png', createGuid);
  recordExportedResource(file, '其它/attachment/b.png', createGuid);
  assert.equal(retry, first);

  const resources = buildAuxiliaryResources(
    [file], '前端', new Set(), (kind, path) => createGuid(kind, path),
  );
  assert.deepEqual(resources.map(item => [item.path, item.kind]), [
    ['attachment', 'folder'],
    ['attachment/a.png', 'file'],
  ]);
  assert.equal(resources[1].guid, first.guid);
});

test('resource folders already represented by TOC directories are not duplicated', () => {
  const file = { exportedResources: [{ path: '知识库/章节/assets/x.svg', kind: 'file', guid: 'f-00000000001' }] };
  const resources = buildAuxiliaryResources(
    [file], '知识库', new Set(['章节']), kind => `${kind === 'folder' ? 'd' : 'f'}-00000000002`,
  );
  assert.deepEqual(resources.map(item => item.path), ['章节/assets', '章节/assets/x.svg']);
});
