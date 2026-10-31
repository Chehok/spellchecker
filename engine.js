(function (root) {
const data = typeof module !== 'undefined' ? require('./data.js') : root.SPELL_DATA;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const dict = data.DICT.slice().sort((a, b) => b[0].length - a[0].length);
const dictRe = new RegExp(dict.map(d => esc(d[0])).join('|'), 'g');
const dictMap = new Map(dict.map(d => [d[0], d]));
function check(text) {
  const issues = [];
  const taken = new Uint8Array(text.length);
  const push = (start, end, sug, msg) => {
    for (let i = start; i < end; i++) if (taken[i]) return;
    if (end === start && taken[start]) return;
    for (let i = start; i < end; i++) taken[i] = 1;
    issues.push({ start, end, original: text.slice(start, end), suggestion: sug, message: msg });
  };
  let m; dictRe.lastIndex = 0;
  while ((m = dictRe.exec(text))) { const d = dictMap.get(m[0]); push(m.index, m.index + m[0].length, d[1], d[2]); }
  for (const [re, rep, msg] of data.RULES) {
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text))) {
      if (!m[0].length) { r.lastIndex++; continue; }
      const sug = rep.replace(/\$(\d)/g, (_, n) => m[n] || '');
      if (sug !== m[0]) push(m.index, m.index + m[0].length, sug, msg);
    }
  }
  return issues.sort((a, b) => a.start - b.start);
}
function applyAll(text, issues) {
  let out = text;
  for (const i of [...issues].sort((a, b) => b.start - a.start)) out = out.slice(0, i.start) + i.suggestion + out.slice(i.end);
  return out;
}
function summarize(issues) {
  const m = new Map();
  for (const i of issues) { const k = i.original.trim() || i.original; const e = m.get(k) || { original: k, suggestion: i.original.trim() ? i.suggestion.trim() : i.suggestion, count: 0 }; e.count++; m.set(k, e); }
  return [...m.values()].sort((a, b) => b.count - a.count);
}
const api = { check, applyAll, summarize, dictSize: data.DICT.length, ruleCount: data.RULES.length };
if (typeof module !== 'undefined') module.exports = api; else root.SpellEngine = api;
})(this);
