const VALID_BITS = new Set([64, 72]);

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function encodeBase62(bytes, length) {
  const quotient = Array.from(bytes);
  const encoded = [];
  let first = 0;
  while (first < quotient.length) {
    let remainder = 0;
    for (let index = first; index < quotient.length; index += 1) {
      const value = remainder * 256 + quotient[index];
      quotient[index] = Math.floor(value / 62);
      remainder = value % 62;
    }
    encoded.push(BASE62[remainder]);
    while (first < quotient.length && quotient[first] === 0) first += 1;
  }
  return encoded.reverse().join('').padStart(length, '0');
}

export function normalizeGuidBits(value) {
  const bits = Number(value);
  return VALID_BITS.has(bits) ? bits : 64;
}

export function createGuidToken(bits = 64, random = globalThis.crypto) {
  const bytes = new Uint8Array(normalizeGuidBits(bits) / 8);
  if (!random?.getRandomValues) throw new Error('当前环境不支持安全随机数生成');
  random.getRandomValues(bytes);
  return encodeBase62(bytes, normalizeGuidBits(bits) === 72 ? 13 : 11);
}

export function createTypedGuid(kind, bits = 64, used = null, random = globalThis.crypto) {
  if (kind !== 'f' && kind !== 'd') throw new Error('GUID 类型必须是 f 或 d');
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const guid = `${kind}-${createGuidToken(bits, random)}`;
    if (!used || !used.has(guid)) {
      used?.add(guid);
      return guid;
    }
  }
  throw new Error('无法生成唯一 GUID');
}

export function pairedGuid(kind, guid) {
  const token = String(guid || '').match(/^[fd][:-]([A-Za-z0-9_-]+)$/)?.[1];
  if (!token || (kind !== 'f' && kind !== 'd')) throw new Error('无法生成配对 GUID');
  return `${kind}-${token}`;
}
