// 洗牌与抽牌：只用 crypto.getRandomValues，结果绝不由 LLM 生成
export function randInt(n) {
  const buf = new Uint32Array(1), limit = Math.floor(0x100000000 / n) * n;
  let x;
  do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
  return x % n;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// 洗牌：重新排列，并为每张牌独立决定正逆位（50%）
export function shuffleDeck(deck, allowReversed) {
  return shuffle(deck).map(c => ({ stem: c.stem, reversed: allowReversed ? randInt(2) === 1 : false }));
}

// 切牌：把整副牌随机分成三叠，用户选中的那一叠放到最上面
export function splitPiles(deck) {
  const n = deck.length, r = Math.max(1, Math.floor(n / 3) - 12), a = 18 + randInt(r), b = a + 18 + randInt(r);
  return [deck.slice(0, a), deck.slice(a, b), deck.slice(b)];
}
export function cut(piles, chosen) {
  return [...piles[chosen], ...piles.filter((_, i) => i !== chosen).flat()];
}
