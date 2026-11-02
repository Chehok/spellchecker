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
    const issue = { start, end, original: text.slice(start, end), suggestion: sug, message: msg };
    if (!isFormatting(issue)) {
      let left = start, right = end;
      while (left > 0 && /[\p{L}\p{N}\p{M}]/u.test(text[left - 1])) left--;
      while (right < text.length && /[\p{L}\p{N}\p{M}]/u.test(text[right])) right++;
      issue.wordOriginal = text.slice(left, right);
      issue.wordSuggestion = text.slice(left, start) + sug + text.slice(end, right);
    }
    issues.push(issue);
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
const words = s => JSON.stringify(s.match(/[\p{L}\p{N}\p{M}]+/gu) || []);
const isFormatting = i => words(i.original) === words(i.suggestion);
function summarize(issues) {
  const m = new Map();
  for (const i of issues) {
    if (isFormatting(i)) continue;
    const original = (i.wordOriginal ?? i.original).trim();
    const suggestion = (i.wordSuggestion ?? i.suggestion).trim();
    if (original === suggestion) continue;
    const e = m.get(original) || { original, suggestion, count: 0 };
    e.count++; m.set(original, e);
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}
const countFormatting = issues => issues.filter(i => i.original !== i.suggestion && isFormatting(i)).length;
const api = { check, applyAll, summarize, countFormatting, dictSize: data.DICT.length, ruleCount: data.RULES.length };
if (typeof module !== 'undefined') module.exports = api; else root.SpellEngine = api;
})(this);
