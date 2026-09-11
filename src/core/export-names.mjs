/** Assign stable portable names while respecting names already occupied in the directory. */
export function assignUniqueNames(items, used = new Set(), orderOf = item => item.order || 0) {
  const groups = new Map();
  items.forEach(item => {
    if (!groups.has(item.base)) groups.set(item.base, []);
    groups.get(item.base).push(item);
  });
  const pending = [];
  for (const [base, list] of groups) {
    list.sort((a, b) => orderOf(a) - orderOf(b));
    let firstPending = 0;
    if (!used.has(base)) {
      list[0].name = base;
      used.add(base);
      firstPending = 1;
    }
    for (let index = firstPending; index < list.length; index += 1) pending.push({ item: list[index], base });
  }
  pending.sort((a, b) => orderOf(a.item) - orderOf(b.item));
  for (const { item, base } of pending) {
    for (let suffix = 1; ; suffix += 1) {
      const candidate = `${base}-${suffix}`;
      if (!used.has(candidate)) {
        item.name = candidate;
        used.add(candidate);
        break;
      }
    }
  }
  return items;
}
